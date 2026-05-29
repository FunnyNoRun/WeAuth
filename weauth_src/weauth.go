package main

/*
#include <stdlib.h>

// 1. 定义回调函数签名
typedef void (*callback_type)(int, char*);

// 2. 【新增】桥接函数：让 C 语言自己去调用这个指针
static inline void call_c_callback(callback_type cb, int eventType, char* msg) {
    if (cb != NULL) {
        cb(eventType, msg);
    }
}
*/
import "C"
import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unsafe"

	"wechatdll/Algorithm"
	"wechatdll/Cilent/mm"
	"wechatdll/Mmtls"
	"wechatdll/baseinfo"
	"wechatdll/clientsdk/baseutils"
	"wechatdll/comm"
	"wechatdll/models"
	"wechatdll/models/Login"

	"github.com/golang/protobuf/proto"
)

var globalCallback C.callback_type

func notifyRust(eventType int, msg string) {
	if globalCallback == nil {
		return
	}

	cMsg := C.CString(msg)
	defer C.free(unsafe.Pointer(cMsg))
	
	C.call_c_callback(globalCallback, C.int(eventType), cMsg)
}

//export RegisterCallback
func RegisterCallback(cb C.callback_type) {
	globalCallback = cb
}

//export StartAuthFlow
func StartAuthFlow() C.int {
	go runAuthFlow()
	return 0 // 返回 0 表示成功启动
}

// 核心业务流程
func runAuthFlow() {
	notifyRust(0, "=== WeChat Car 扫码登录初始化 ===")

	deviceId := baseutils.CreateDeviceId("")
	deviceIdByte, _ := hex.DecodeString(deviceId)

	D := &comm.LoginData{
		Wxid:          "",
		Pwd:           "",
		Aeskey:        []byte(baseutils.RandSeq(16)),
		Deviceid_str:  deviceId,
		Deviceid_byte: deviceIdByte,
		DeviceType:    Algorithm.CarDeviceType,
		ClientVersion: Algorithm.CarVersion,
		DeviceName:    Algorithm.CarDeviceName,
		ShortHost:     Algorithm.MmtlsShortHost,
		LongHost:      Algorithm.MmtlsLongHost,
		Proxy:         models.ProxyInfo{},
		RomModel:      Algorithm.CarModel,
		Imei:          baseinfo.IOSImei(deviceId),
		OsVersion:     Algorithm.CarOsVersion,
	}
	D.SoftType = baseinfo.SoftType_iPad(D.Deviceid_str, D.OsVersion, D.RomModel)

	// 1. 初始化MMTLS
	httpclient, MmtlsClient, err := comm.MmtlsInitialize(models.ProxyInfo{}, Algorithm.MmtlsShortHost)
	if err != nil {
		notifyRust(-1, fmt.Sprintf("MMTLS初始化失败: %v", err))
		return
	}
	D.MmtlsKey = MmtlsClient
	notifyRust(0, "MMTLS初始化成功")

	// 2. 获取二维码
	qrBase64, uuid, notifyKey, cookies, err := getQRCode(D, httpclient)
	if err != nil {
		notifyRust(-1, fmt.Sprintf("获取二维码失败: %v", err))
		return
	}

	D.Uuid = uuid
	D.NotifyKey = notifyKey
	D.Cooike = cookies

	// 推送二维码事件 (事件 1)
	notifyRust(1, qrBase64)

	// 3. 轮询检查扫码状态
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	timeout := time.After(5 * time.Minute)

	for {
		select {
		case <-timeout:
			notifyRust(-1, "二维码已过期")
			return

		case <-ticker.C:
			notify, err := checkQRCode(D, httpclient)
			if err != nil {
				// 网络波动等忽略，继续重试
				continue
			}

			status := notify.GetStatus()
			switch status {
			case 0:
				notifyRust(0, "等待扫码...")
			case 1:
				// 事件 2：已扫码
				notifyRust(2, fmt.Sprintf("已扫码，等待确认... (用户: %s)", notify.GetNickName()))
			case 2:
				notifyRust(0, "用户已确认登录，正在完成认证...")
				D.Wxid = notify.GetUserName()
				D.Pwd = notify.GetPwd()
				D.DeviceInfo = createDeviceInfo(D)

				// 4. 完成登录认证
				loginData, err := completeLogin(D)
				if err != nil {
					notifyRust(-1, fmt.Sprintf("登录认证失败: %v", err))
					return
				}

				// 封装核心凭据推送 (事件 3)
				pushCredentialsJSON(loginData)

				// 5. 获取 ThirdAppGrant AuthCode
				grantResult := testThirdAppGrant(loginData)

				// 推送最终结果 (事件 4)
				notifyRust(4, grantResult)
				return // 正常结束

			default:
				notifyRust(0, fmt.Sprintf("未知状态: %d", status))
			}
		}
	}
}

// 封装凭据并转为 JSON 推送
func pushCredentialsJSON(D *comm.LoginData) {
	// 定义一个简化的结构体给外部使用
	type TokenInfo struct {
		Wxid             string `json:"wxid"`
		Uin              uint32 `json:"uin"`
		SessionKey       string `json:"session_key"`
		ClientSessionKey string `json:"client_session_key"`
		AutoAuthKey      string `json:"auto_auth_key"`
		Cookies          string `json:"cookies"`
	}

	info := TokenInfo{
		Wxid:             D.Wxid,
		Uin:              D.Uin,
		SessionKey:       hex.EncodeToString(D.Sessionkey),
		ClientSessionKey: hex.EncodeToString(D.Clientsessionkey),
		AutoAuthKey:      hex.EncodeToString(D.Autoauthkey),
		Cookies:          hex.EncodeToString(D.Cooike),
	}

	jsonData, err := json.Marshal(info)
	if err == nil {
		notifyRust(3, string(jsonData))
	}
}

// 原有函数保持不变，无需修改
func getQRCode(D *comm.LoginData, httpclient *Mmtls.HttpClientModel) (string, string, []byte, []byte, error) {
	D.DeviceToken = &mm.TrustResponse{}

	req := &mm.GetLoginQRCodeRequest{
		BaseRequest: &mm.BaseRequest{
			SessionKey:    []byte{},
			Uin:           proto.Uint32(0),
			DeviceId:      D.Deviceid_byte,
			ClientVersion: proto.Int32(D.ClientVersion),
			DeviceType:    []byte(D.DeviceType),
			Scene:         proto.Uint32(0),
		},
		RandomEncryKey: &mm.SKBuiltinBufferT{
			ILen:   proto.Uint32(uint32(len(D.Aeskey))),
			Buffer: D.Aeskey,
		},
		Opcode:           proto.Uint32(0),
		MsgContextPubKey: nil,
	}

	reqdata, _ := proto.Marshal(req)
	hec := Login.InitHec(D)
	hypack := hec.HybridEcdhPackIosEn(502, 0, nil, reqdata)
	recvData, err := httpclient.MMtlsPost(D.ShortHost, "/cgi-bin/micromsg-bin/getloginqrcode", hypack, D.Proxy)
	if err != nil {
		return "", "", nil, nil, err
	}

	ph1 := hec.HybridEcdhPackIosUn(recvData)
	resp := &mm.GetLoginQRCodeResponse{}
	err = proto.Unmarshal(ph1.Data, resp)
	if err != nil {
		return "", "", nil, nil, err
	}

	if resp.GetBaseResponse().GetRet() != 0 {
		return "", "", nil, nil, fmt.Errorf("获取二维码失败: %s", resp.GetBaseResponse().GetErrMsg().GetString_())
	}

	qrBase64 := base64.StdEncoding.EncodeToString(resp.GetQrcode().GetBuffer())
	return qrBase64, resp.GetUuid(), resp.GetNotifyKey().GetBuffer(), ph1.Cookies, nil
}

func checkQRCode(D *comm.LoginData, httpclient *Mmtls.HttpClientModel) (*mm.LoginQRCodeNotify, error) {
	timenow := uint32(time.Now().Unix())

	req := &mm.CheckLoginQRCodeRequest{
		BaseRequest: &mm.BaseRequest{
			SessionKey:    D.Aeskey,
			Uin:           proto.Uint32(0),
			DeviceId:      D.Deviceid_byte,
			ClientVersion: proto.Int32(D.ClientVersion),
			DeviceType:    []byte(D.DeviceType),
			Scene:         proto.Uint32(0),
		},
		RandomEncryKey: &mm.SKBuiltinBufferT{
			ILen:   proto.Uint32(uint32(len(D.Aeskey))),
			Buffer: D.Aeskey,
		},
		Uuid:      &D.Uuid,
		TimeStamp: &timenow,
		Opcode:    proto.Uint32(0),
	}

	reqdata, _ := proto.Marshal(req)
	hec := &Algorithm.Client{}
	hec.Init("IOS")
	hecData := hec.HybridEcdhPackIosEn(503, 0, nil, reqdata)
	recvData, err := httpclient.MMtlsPost(Algorithm.MmtlsShortHost, "/cgi-bin/micromsg-bin/checkloginqrcode", hecData, D.Proxy)
	if err != nil {
		return nil, err
	}

	ph1 := hec.HybridEcdhPackIosUn(recvData)
	resp := &mm.CheckLoginQRCodeResponse{}
	err = proto.Unmarshal(ph1.Data, resp)
	if err != nil {
		return nil, err
	}

	if resp.GetBaseResponse().GetRet() != 0 {
		return nil, fmt.Errorf("检查失败: %s", resp.GetBaseResponse().GetErrMsg().GetString_())
	}

	if resp.GetNotifyPkg().GetNotifyData().GetBuffer() == nil {
		return nil, fmt.Errorf("通知数据为空")
	}

	notifydata := Algorithm.AesDecrypt(resp.GetNotifyPkg().GetNotifyData().GetBuffer(), D.NotifyKey)
	notify := &mm.LoginQRCodeNotify{}
	err = proto.Unmarshal(notifydata, notify)
	if err != nil {
		return nil, err
	}

	D.Cooike = ph1.Cookies
	return notify, nil
}

func completeLogin(D *comm.LoginData) (*comm.LoginData, error) {
	loginRes, prikey, pubkey, Cookie, DeviceToken, err := Login.SecManualAuth(D)
	if err != nil {
		return nil, err
	}

	if loginRes.GetBaseResponse().GetRet() != 0 || loginRes.GetUnifyAuthSectFlag() == 0 {
		return nil, fmt.Errorf("登录失败: ret=%d", loginRes.GetBaseResponse().GetRet())
	}

	WxLoginecdhkey := Algorithm.DoECDH713Key(prikey, loginRes.GetAuthSectResp().GetSvrPubEcdhkey().GetKey().GetBuffer())
	D.Loginecdhkey = WxLoginecdhkey

	ecdhdecrptkeyByte := baseutils.Md5Hash(WxLoginecdhkey)

	D.Uin = loginRes.GetAuthSectResp().GetUin()
	D.Wxid = loginRes.GetAcctSectResp().GetUserName()
	D.Alais = loginRes.GetAcctSectResp().GetAlias()
	D.Mobile = loginRes.GetAcctSectResp().GetBindMobile()
	D.Email = loginRes.GetAcctSectResp().GetBindEmail()
	D.NickName = loginRes.GetAcctSectResp().GetNickName()
	D.Cooike = Cookie
	D.Sessionkey = Algorithm.AesDecrypt(loginRes.GetAuthSectResp().GetSessionKey().GetBuffer(), ecdhdecrptkeyByte)
	D.Sessionkey_2 = loginRes.GetAuthSectResp().GetSessionKey().GetBuffer()
	D.Autoauthkey = loginRes.GetAuthSectResp().GetAutoAuthKey().GetBuffer()
	D.Autoauthkeylen = int32(loginRes.GetAuthSectResp().GetAutoAuthKey().GetILen())
	D.Serversessionkey = loginRes.GetAuthSectResp().GetServerSessionKey().GetBuffer()
	D.Clientsessionkey = loginRes.GetAuthSectResp().GetClientSessionKey().GetBuffer()
	D.DeviceToken = DeviceToken
	D.ShortHost = comm.Rmu0000(*loginRes.NetworkSectResp.BuiltinIplist.ShortConnectIplist[0].Host)
	D.LongHost = comm.Rmu0000(*loginRes.NetworkSectResp.BuiltinIplist.LongConnectIplist[0].Host)
	D.RsaPublicKey = pubkey
	D.RsaPrivateKey = prikey
	D.LoginDate = time.Now().Unix()

	return D, nil
}

func createDeviceInfo(D *comm.LoginData) *baseinfo.DeviceInfo {
	SystemInstallTime := uint64(time.Now().Add(-180 * 24 * time.Hour).Unix())

	deviceInfo := &baseinfo.DeviceInfo{
		UUIDOne:      baseutils.RandomUUID(),
		UUIDTwo:      "",
		DeviceID:     baseutils.Md5Value(strings.Replace(baseutils.RandomUUID(), "-", "", -1)),
		DeviceName:   D.DeviceName,
		TimeZone:     "8.00",
		Language:     "zh_CN",
		DeviceBrand:  "Apple",
		RealCountry:  "CN",
		IphoneVer:    D.RomModel,
		BundleID:     "com.tencent.xin",
		OsTypeNumber: D.OsVersion,
		OsType:       D.DeviceType,
		CoreCount:    3,
		CarrierName:  "中国电信",
		GUID1:        baseutils.RandomUUID(),
		GUID2:        baseutils.RandomUUID(),
		Sdi:          baseutils.Md5Value(baseutils.RandomUUID()),
		InstallTime:  uint64(time.Now().Add(-5 * time.Minute).Unix()),
		KernBootTime: uint64(time.Now().Add(-7 * 24 * time.Hour).Unix()),
	}

	deviceInfo.Sysverplist = Login.GenSysverplist(SystemInstallTime)
	deviceInfo.Dyldcache = Login.GenDyldcache(SystemInstallTime)
	deviceInfo.Var = Login.GenVar(SystemInstallTime)
	deviceInfo.Etcgroup = Login.GenEtcgroup(SystemInstallTime)
	deviceInfo.Etchosts = Login.GenEtchosts(SystemInstallTime)
	deviceInfo.Apfs = Login.GenApfsStat()

	return deviceInfo
}
func testThirdAppGrant(D *comm.LoginData) string {
	req := &mm.SdkOauthAuthorizeRequest{
		BaseRequest: &mm.BaseRequest{
			SessionKey:    D.Sessionkey,
			Uin:           proto.Uint32(D.Uin),
			DeviceId:      D.Deviceid_byte,
			ClientVersion: proto.Int32(D.ClientVersion),
			DeviceType:    []byte(D.DeviceType),
			Scene:         proto.Uint32(0),
		},
		Appid:    proto.String("wx5a2e1ff396785475"),
		Userinfo: proto.String("snsapi_message,snsapi_userinfo,snsapi_friend,snsapi_contact"),
		Tag4:     proto.String(""),
		Url:      proto.String(""),
		Tag8:     proto.String(""),
		Tag9:     proto.String(""),
		Tag10:    proto.String(""),
		Tag11:    proto.String(""),
		Tag12:    proto.Int32(0),
	}

	reqdata, err := proto.Marshal(req)
	if err != nil {
		return fmt.Sprintf("序列化失败: %v", err)
	}

	protobufdata, _, _, err := comm.SendRequest(comm.SendPostData{
		Ip:     D.Mmtlsip,
		Host:   D.ShortHost,
		Cgiurl: "/cgi-bin/mmbiz-bin/sdk_oauth_authorize",
		Proxy:  D.Proxy,
		PackData: Algorithm.PackData{
			Reqdata:          reqdata,
			Cgi:              1388,
			Uin:              D.Uin,
			Cookie:           D.Cooike,
			Sessionkey:       D.Sessionkey,
			EncryptType:      5,
			Loginecdhkey:     D.RsaPublicKey,
			Clientsessionkey: D.Clientsessionkey,
			UseCompress:      true,
		},
	}, D.MmtlsKey)

	if err != nil {
		return fmt.Sprintf("发送请求失败: %v", err)
	}

	// 提取授权码
	code := string(protobufdata)
	re := regexp.MustCompile(`code=(?P<code>.*?)&state=`)
	if !re.MatchString(code) {
		return fmt.Sprintf("未找到授权码\n原始数据: %s", code)
	}

	matches := re.FindStringSubmatch(code)
	if len(matches) < 2 {
		return fmt.Sprintf("提取授权码失败\n原始数据: %s", code)
	}

	authCode := strings.TrimSpace(matches[1])
	return fmt.Sprintf("授权码: %s", authCode)
}

func main() {}
