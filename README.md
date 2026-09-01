# ALL렌탈 Sales Console

내부 영업용 상품 추천 콘솔입니다. 고객용 `allrental_customer`의 상품 JSON을 실시간으로 읽어, 상품별 6개 추천 점수를 계산합니다.

## 기능
- 입문형 / 가성비 / 프리미엄 / 육아 / 신혼 / 입주 추천점수
- 카테고리 및 브랜드/모델 검색
- 월 예산 기반 재정렬
- 고객상황별 TOP 추천
- 상담 멘트 자동 생성/복사
- 관리자 상품의 브랜드+모델명 정확 매칭을 통한 최대 수수료 표시
- 매칭되지 않은 상품은 `수수료 미등록`으로 표시

## 실행
현재 버전은 단일 `index.html` 정적 사이트입니다. 로컬에서 파일을 열거나 정적 호스팅에 배포할 수 있습니다.

## 배포
Vercel에 연결할 경우 이 사이트는 내부 영업정보를 포함하므로 공개 URL만 숨기는 방식보다 Vercel Deployment Protection 또는 별도 인증을 권장합니다.

## 상품 데이터
현재 데이터 소스는 고객용 `allrental_customer` 저장소의 `products_data.json`입니다.

수수료 데이터는 관리자 저장소 `allrentaladmin/public/data/products.json`에서 생성한
`commission-map.json`을 사용합니다. 관리자 데이터가 갱신되면 아래 명령으로 다시 생성합니다.

```bash
node scripts/build-commission-map.mjs ../allrentaladmin/public/data/products.json commission-map.json
```

URL은 두 저장소 간 공통 식별자가 아니므로 매칭에 사용하지 않습니다. 브랜드와 모델명을
대소문자·공백·구분기호만 정규화해 정확히 일치할 때만 수수료를 연결합니다.
