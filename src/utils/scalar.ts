export default `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KaiaPay API Documentation</title>
    <style>
        body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    .auth-bar { position:fixed; top:0; right:0; display:flex; gap:8px; padding:8px 12px; background:#0000000d; backdrop-filter:saturate(1.2) blur(4px); align-items:center; z-index:9999; }
    .auth-bar input { padding:6px 8px; border:1px solid #ddd; border-radius:8px; }
    .auth-bar button { padding:6px 10px; border:0; border-radius:8px; cursor:pointer; }
    /* Scalar가 페이지 전체를 쓰므로 auth-bar만 떠 있게 */
    #api-reference { margin-top:48px; display:block; }
    iframe#privy-embedded-wallet { display:none; } /* 지갑 iframe은 보이지 않게만 탑재 */
    </style>
</head>
<body>
   	<script
      id="api-reference"
      data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
	 <!-- 간단 로그인 UI -->
  <div class="auth-bar">
    <input id="email" type="email" placeholder="email@example.com" />
    <button id="send">Send code</button>
    <input id="code" type="text" placeholder="6-digit code" />
    <button id="login">Sign in</button>
	<button id="logout">Sign out</button>
    <button id="copyToken" title="Copy Privy access token">Copy token</button>
    <span id="status"></span>
  </div>

  <!-- Privy embedded wallet iframe (필수: core-js 보안 컨텍스트 연결용) -->
  <iframe id="privy-embedded-wallet"></iframe>

  <!-- Privy core-js: ESM로 CDN에서 로드 -->
  <script type="module">
    import Privy, { LocalStorage } from 'https://cdn.jsdelivr.net/npm/@privy-io/js-sdk-core/+esm';

    // 대시보드에서 발급받은 값으로 교체
    const appId    = 'cmel98g0x02u6l40btr617b87';
    const clientId = 'client-WY6Pq8pL3HCTUfyq3nwBfdogjN1pP26QYXZ9gqdLRo8Sk';

    // Privy 클라이언트 단일 인스턴스
    const privy = new Privy({
      appId,
      clientId,
      storage: new LocalStorage(),
      supportedChains: [{ id: 8217, name: 'Kaia', rpcUrls: ['https://kaia.nirvanalabs.xyz/kaiaennode-499hw?apikey=2b4f3ffc4668c6df22c8b09e8dab80ff5eb2'] }]
    });

    // Embedded wallet 보안 컨텍스트 연결 (필수)
    const iframe = document.getElementById('privy-embedded-wallet');
    iframe.id = 'privy-embedded-wallet';
    iframe.src = privy.embeddedWallet.getURL();
    window.addEventListener('message', (e) => privy.embeddedWallet.onMessage(e.data));
    // core-js에서 메시지 포스터 지정
    privy.setMessagePoster(iframe.contentWindow);

    // UI 엘리먼트
    const $email  = document.getElementById('email');
    const $code   = document.getElementById('code');
    const $send   = document.getElementById('send');
    const $login  = document.getElementById('login');
    const $copy   = document.getElementById('copyToken');
    const $status = document.getElementById('status');
	const $logout = document.getElementById('logout');

	function setAsLogined(){
		$email.style.display = 'none';
		$code.style.display = 'none';
		$send.style.display = 'none';
		$login.style.display = 'none';
		$copy.style.display = 'none';
		$status.textContent = 'Signed in';
		$logout.style.display = 'block';
	}

	function setAsLogouted(){	
		$email.style.display = 'block';
		$code.style.display = 'block';
		$send.style.display = 'block';
		$login.style.display = 'block';
		$copy.style.display = 'block';
		$status.textContent = 'Not signed in';
		$logout.style.display = 'none';
	}

    // 1) 이메일로 인증코드 전송
    $send.onclick = async () => {
		console.log('send')
      try {
        await privy.auth.email.sendCode($email.value.trim());
        $status.textContent = 'Code sent';
      } catch (err) {
        console.error(err);
        $status.textContent = 'Failed to send code';
      }
    };

    // 2) 인증코드로 로그인
    let accessToken = null;

	// (A) 페이지 로드시 세션 복원 시도
	window.addEventListener('DOMContentLoaded', async () => {
	try {
		accessToken = await privy.getAccessToken(); // 세션이 있으면 유효 토큰, 없으면 null
		if (accessToken) {
			// 이메일을 다시 묻지 않고, 로그인됨 UI로 전환
			setAsLogined();
            // await privy.embeddedWallet.create();
		} else {
			setAsLogouted();
		}
	} catch (e) {
		console.error(e);
		document.getElementById('status').textContent = 'Session check failed';
	}
	});

	// (B) 로그인 성공 시에도 동일하게 토큰/상태 갱신
	$login.onclick = async () => {
	try {
		const { user } = await privy.auth.email.loginWithCode($email.value.trim(), $code.value.trim());
		accessToken = await privy.getAccessToken();
        // await privy.embeddedWallet.create(); 
		console.log('Privy access token:', accessToken);
		setAsLogined();
	} catch (err) {
		console.error(err);
		document.getElementById('status').textContent = 'Login failed';
	}
	};

	$logout.onclick = async () => {
		await privy.auth.logout();
		setAsLogouted();
	}

    // 3) 토큰 복사 버튼(개발 편의)
    $copy.onclick = async () => {
      if (!accessToken) {
        // 토큰이 없으면 재시도
        try { accessToken = await privy.getAccessToken(); } catch {}
      }
      if (accessToken) {
        await navigator.clipboard.writeText(accessToken);
        $status.textContent = 'Token copied';
      } else {
        $status.textContent = 'No token';
      }
    };
</script>
</body>
</html>`;
