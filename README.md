# KaiaPay Server

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-000000?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-000000?style=for-the-badge&logo=drizzle&logoColor=white)](https://orm.drizzle.team/)

## 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [설치 및 실행](#-설치-및-실행)
- [API 문서](#-api-문서)
- [데이터베이스 스키마](#-데이터베이스-스키마)
- [환경 설정](#-환경-설정)
- [배포](#-배포)
- [라이선스](#-라이선스)

### 핵심 가치

- **보안성**: 블록체인 기반의 투명하고 안전한 거래
- **편의성**: 간단한 링크나 ID를 통한 결제
- **확장성**: Cloudflare Workers 기반의 글로벌 서비스
- **비용 효율성**: 수수료 위임 시스템을 통한 사용자 경험 향상

## 주요 기능

### 결제 시스템

- **링크 기반 결제**: 고유한 결제 링크 생성 및 공유
- **KaiaPay ID 결제**: 사용자 ID를 통한 직접 결제
- **외부 지갑 결제**: 외부 블록체인 주소로의 송금
- **결제 코드 시스템**: 15자리 고유 코드를 통한 결제

### 거래 관리

- **입금/출금**: KAIA 체인 기반 자산 관리
- **송금 추적**: 실시간 거래 상태 모니터링
- **거래 내역**: 상세한 거래 기록 및 검색
- **취소 기능**: 일정 시간 내 거래 취소 지원

### 수수료 위임 시스템

- **사용자 경험 향상**: 사용자가 수수료를 지불하지 않아도 됨
- **자동 릴레이**: 서명된 거래의 자동 처리
- **잔액 모니터링**: 수수료 지불자 잔액 실시간 확인

## 기술 스택

### Backend Framework

- **Hono**
- **Cloudflare Workers**
- **TypeScript**

### Database & ORM

- **PostgreSQL**
- **Drizzle ORM**
- **Cloudflare Hyperdrive**

### Blockchain Integration

- **Viem**
- **Kaia Chain**
- **Web3.js**

### Authentication & Security

- **Privy**
- **JWT**
- **CORS**

### Development Tools

- **Wrangler**
- **Drizzle Kit**
- **OpenAPI**

## 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │  KaiaPay Server  │    │   Blockchain    │
│                 │◄──►│                  │◄──►│                 │
│   (Frontend)    │    │  (Cloudflare)    │    │   (KAIA/USDT)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   Database       │
                       └──────────────────┘
```

### 아키텍처 특징

- **서버리스**: Cloudflare Workers 기반의 자동 확장
- **엣지 컴퓨팅**: 글로벌 사용자를 위한 빠른 응답
- **마이크로서비스**: 기능별 모듈화된 API 구조
- **타입 안전성**: TypeScript와 Drizzle ORM을 통한 안전성

## 설치 및 실행

### 사전 요구사항

- Node.js 18.0.0 이상
- Yarn 패키지 매니저
- Cloudflare 계정
- PostgreSQL 데이터베이스

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/kaiapay-server.git
cd kaiapay-server
```

### 2. 의존성 설치

```bash
yarn install
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필수 환경 변수 설정
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
FEEPAYER_PK=your_fee_payer_private_key
```

### 4. 데이터베이스 설정

```bash
# 데이터베이스 마이그레이션
yarn db:generate
yarn db:migrate

# 데이터베이스 스튜디오 실행 (선택사항)
yarn db:studio
```

### 5. 개발 서버 실행

```bash
# 로컬 개발 서버
yarn dev

# 또는
yarn start
```

### 6. 배포

```bash
# 개발 환경 배포
yarn deploy:development

# 프로덕션 환경 배포
yarn deploy:production
```

## API 문서

### 인증

모든 보호된 API 엔드포인트는 JWT 토큰 인증이 필요합니다.

```http
Authorization: Bearer <your_jwt_token>
```

### 주요 API 엔드포인트

#### 사용자 관리

- `GET /api/user/me` - 현재 사용자 정보 조회
- `PUT /api/user/kaiapay-id` - KaiaPay ID 업데이트

#### 결제 시스템

- `POST /api/payment/create` - 새로운 결제 생성
- `GET /api/payment/:code` - 결제 코드로 결제 정보 조회

#### 거래 관리

- `POST /api/transaction/deposit` - 입금 처리
- `POST /api/transaction/transfer-with-link` - 링크를 통한 송금
- `POST /api/transaction/transfer-with-kaiapay-id` - KaiaPay ID를 통한 송금
- `GET /api/transaction/:id` - 거래 상세 정보 조회
- `GET /api/transaction` - 거래 목록 조회

#### 수수료 위임

- `POST /api/fee-delegation/relay` - 수수료 위임 릴레이
- `GET /api/fee-delegation/balance` - 수수료 지불자 잔액 조회

#### 공개 API

- `GET /public/to-address` - 주소별 거래 조회
- `GET /public/pot-info` - 팟 정보 조회

### API 문서 자동 생성

프로젝트는 OpenAPI 스키마를 자동으로 생성하며, 다음 URL에서 확인할 수 있습니다:

- **로컬**: `http://localhost:8787/`
- **개발**: `https://dev-api.kaiapay.app/`
- **프로덕션**: `https://api.kaiapay.app/`

## 데이터베이스 스키마

### Users 테이블

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- Privy ID
  kaiapay_id TEXT,               -- KaiaPay 사용자 ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions 테이블

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address TEXT NOT NULL,     -- 송금자 주소
  to_address TEXT NOT NULL,       -- 수신자 주소
  token TEXT NOT NULL,            -- 토큰 컨트랙트 주소
  amount NUMERIC NOT NULL,        -- 거래 금액
  sender_alias TEXT,              -- 송금자 별칭
  recipient_alias TEXT,           -- 수신자 별칭
  kind TEXT NOT NULL,             -- 거래 유형
  method TEXT NOT NULL,           -- 거래 방법
  status TEXT NOT NULL,           -- 거래 상태
  deadline TIMESTAMP,             -- 만료 시간
  can_cancel BOOLEAN DEFAULT FALSE, -- 취소 가능 여부
  tx_hash VARCHAR(80),            -- 거래 해시
  cancel_tx_hash VARCHAR(80),     -- 취소 거래 해시
  memo VARCHAR(200),              -- 메모
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP
);
```

### Payments 테이블

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(15) NOT NULL UNIQUE, -- 결제 코드
  receiver_user_id TEXT NOT NULL,    -- 수신자 사용자 ID
  title TEXT NOT NULL,               -- 결제 제목
  currency TEXT,                     -- 통화 (USDT/KAIA)
  amount NUMERIC,                    -- 결제 금액
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 환경 설정

### 개발 환경

```bash
# 개발 서버 설정
LINK_BASE_URL=https://dev.kaiapay.app
DATABASE_ID=
```

### 프로덕션 환경

```bash
# 프로덕션 서버 설정
LINK_BASE_URL=https://kaiapay.app
DATABASE_ID=
```

### 보안 설정

- **Privy App ID/Secret**: Web3 사용자 인증
- **Fee Payer Private Key**: 수수료 위임 시스템
- **Database Connection**: PostgreSQL 연결 문자열

## 배포

### Cloudflare Workers 배포

```bash
# 개발 환경
wrangler deploy --env development

# 프로덕션 환경
wrangler deploy --env production
```

### 환경별 도메인

- **개발**: `dev-api.kaiapay.app`
- **프로덕션**: `api.kaiapay.app`

### 데이터베이스 배포

```bash
# 스키마 생성
yarn db:generate

# 마이그레이션 적용
yarn db:migrate

# 또는 직접 푸시
yarn db:push
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**KaiaPay. Send Stablecoin Like You Send a Text Message - Earn DeFi Yields, No Hassle**
