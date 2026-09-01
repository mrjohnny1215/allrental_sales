# ALL렌탈 Sales Console

내부 영업용 상품 추천 콘솔입니다. 고객용 `allrental_customer`의 상품 JSON을 실시간으로 읽어, 상품별 6개 추천 점수를 계산합니다.

## 기능
- 입문형 / 가성비 / 프리미엄 / 육아 / 신혼 / 입주 추천점수
- 카테고리 및 브랜드/모델 검색
- 월 예산 기반 재정렬
- 고객상황별 TOP 추천
- 상담 멘트 자동 생성/복사

## 실행
현재 버전은 단일 `index.html` 정적 사이트입니다. 로컬에서 파일을 열거나 정적 호스팅에 배포할 수 있습니다.

## 배포
Vercel에 연결할 경우 이 사이트는 내부 영업정보를 포함하므로 공개 URL만 숨기는 방식보다 Vercel Deployment Protection 또는 별도 인증을 권장합니다.

## 상품 데이터
현재 데이터 소스는 고객용 `allrental_customer` 저장소의 `products_data.json`입니다.
