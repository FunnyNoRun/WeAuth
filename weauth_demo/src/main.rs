use std::ffi::CStr;
use std::os::raw::{c_char, c_int};
use std::sync::mpsc;
use std::sync::OnceLock;

static EXIT_SENDER: OnceLock<mpsc::Sender<bool>> = OnceLock::new();

#[link(name = "weauth", kind = "raw-dylib")]
unsafe extern "C" {
    fn RegisterCallback(cb: extern "C" fn(c_int, *const c_char));
    fn StartAuthFlow() -> c_int;
}

extern "C" fn auth_callback(event_type: c_int, msg: *const c_char) {
    let message = unsafe {
        if msg.is_null() {
            String::new()
        } else {
            CStr::from_ptr(msg).to_string_lossy().into_owned()
        }
    };

    match event_type {
        0 => println!("[状态] {}", message),
        1 => {
            println!("\n[获取到二维码] Base64数据长度: {}", message.len());

            use base64::{Engine as _, engine::general_purpose};
            match general_purpose::STANDARD.decode(&message) {
                Ok(bytes) => {
                    let path = "qr_code.png";
                    if let Ok(_) = std::fs::write(path, bytes) {
                        println!("✓ 二维码已成功保存到本地: {}", path);

                        #[cfg(target_os = "windows")]
                        let _ = std::process::Command::new("cmd")
                            .args(["/c", "start", "", path])
                            .spawn();
                    }
                }
                Err(e) => eprintln!("❌ 解码二维码失败: {}", e),
            }
        }
        2 => println!("\n[用户动作] {}", message),
        3 => {
            println!("\n[登录成功] 获取到核心鉴权令牌:");
            println!("{}", message);
        }
        4 => {
            println!("\n[流程结束] 获取到 Auth Code: {}", message);
            if let Some(tx) = EXIT_SENDER.get() {
                let _ = tx.send(true);
            }
        }
        -1 => {
            eprintln!("\n[发生错误] {}", message);
            if let Some(tx) = EXIT_SENDER.get() {
                let _ = tx.send(false);
            }
        }
        _ => println!("[未知事件 {}] {}", event_type, message),
    }
}

fn main() {
    let (tx, rx) = mpsc::channel();
    EXIT_SENDER.set(tx).unwrap();

    unsafe {
        RegisterCallback(auth_callback);

        println!("正在启动微信授权引擎...");
        let res = StartAuthFlow();
        if res != 0 {
            eprintln!("启动失败");
            return;
        }
    }

    match rx.recv() {
        Ok(true) => println!("🎉 授权任务成功完成并退出。"),
        Ok(false) => println!("❌ 授权任务因错误退出。"),
        Err(_) => println!("通道异常断开。"),
    }
}