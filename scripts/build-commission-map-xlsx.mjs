import openpyxl
import re, json, os, sys

INPUT_XLSX = sys.argv[1] if len(sys.argv) > 1 else '/opt/data/profiles/sales-os/attachments/수수료표-2.xlsx'
CUSTOMER_PRODUCTS = '/opt/data/allrental_customer/products_data.json'
OUTPUT_JSON = sys.argv[2] if len(sys.argv) > 2 else '/opt/data/allrental_sales/commission-map.json'

wb = openpyxl.load_workbook(INPUT_XLSX, data_only=True)
print("SHEETS:", wb.sheetnames)

out = []
seen = set()
for name in wb.sheetnames:
    if name == '추출된 모델':
        continue
    ws = wb[name]
    print(f"Parsing sheet: {name}, rows={ws.max_row}")
    for row in ws.iter_rows(min_row=2, values_only=True):
        brand = (row[0] or '').strip()
        product_group = (row[1] or '').strip()
        model = (row[2] or '').strip()
        product_name = (row[3] or '').strip()
        regulation = (row[4] or '').strip()
        if not brand or not model:
            continue
        commission_vals = []
        for cell in row[5:11]:
            try:
                n = float(cell)
                if n > 0:
                    commission_vals.append(n)
            except Exception:
                pass
        if not commission_vals:
            continue
        commission = max(commission_vals)
        key = (brand.upper(), re.sub(r'[^0-9A-Z가-힣ㄱ-ㅎㅏ-ㅣ]', '', model).upper())
        if key in seen:
            continue
        seen.add(key)
        out.append({
            'brand': brand,
            'product_group': product_group,
            'model': model,
            'product_name': product_name,
            'regulation': regulation,
            'commission': commission,
            'source_sheet': name
        })

print(f"Total raw entries: {len(out)}")

# Normalize commission-map entries
grouped = {}
for item in out:
    nb = re.sub(r'\s+', '', item['brand']).upper()
    nm = re.sub(r'[^0-9A-Z가-힣ㄱ-ㅎㅏ-ㅣ]', '', item['model']).upper()
    key = nb + '|' + nm
    if key not in grouped:
        grouped[key] = {
            'brand': item['brand'],
            'model': item['model'],
            'commission': item['commission'],
            'product_group': item.get('product_group',''),
            'regulation': item.get('regulation',''),
            'source_sheet': item.get('source_sheet',''),
            'sourceCount': 0
        }
    else:
        grouped[key]['commission'] = max(grouped[key]['commission'], item['commission'])

# Match with customer products
try:
    with open(CUSTOMER_PRODUCTS, 'r', encoding='utf-8') as f:
        products = json.load(f)
except Exception as e:
    print("Failed to load customer products:", e)
    products = []

for p in products:
    b = re.sub(r'\s+', '', p.get('brand','')).upper()
    m = re.sub(r'[^0-9A-Z가-힣ㄱ-ㅎㅏ-ㅣ]', '', p.get('model','')).upper()
    if not b or not m:
        continue
    k = b + '|' + m
    if k in grouped:
        grouped[k]['sourceCount'] += 1

entries = sorted(grouped.values(), key=lambda x: (x['brand'].upper(), x['model'].upper()))

# Compute match status
for e in entries:
    nb = re.sub(r'\s+', '', e['brand']).upper()
    nm = re.sub(r'[^0-9A-Z가-힣ㄱ-ㅎㅏ-ㅣ]', '', e['model']).upper()
    e['matchKey'] = nb + '|' + nm

result = {
    'metadata': {
        'source': 'mrjohnny1215/sales-os:수수료표-2.xlsx',
        'matchKey': 'normalized brand + normalized model',
        'amount': 'maximum registered commission across plans/regulations',
        'entryCount': len(entries),
        'brandAlias': {'SK매직':'SK', '청호나이스':'청호', '현대큐밍':'현대'}
    },
    'entries': entries
}

os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"Wrote {len(entries)} commission entries to {OUTPUT_JSON}")

# Stats
matched = sum(1 for e in entries if e.get('sourceCount',0) > 0)
print(f"Matched with customer products: {matched}/{len(entries)}")