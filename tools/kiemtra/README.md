# Kiểm tra thực tế màn chơi (Claude, 24–25/11/2026)

Dùng sau khi thêm / sửa phố, phòng, độ khó. `<A>` là một thư mục tạm (vd. thư mục nháp của phiên).

1. Danh sách màn:
   `python3 -c "import json;ids=['stage_1','stage_2','stage_3','stage_4'];[ids.extend([s['stage']['id'] for s in json.load(open(f'src/core/streets/generated/{x}.json'))['shops']]+[x]) for x in ['street_tang_bat_ho','street_pho_ca_phe','street_phan_dinh_phung','street_nguyen_van_troi','street_hoang_dieu','street_tran_phu']];json.dump(ids,open('<A>/ids.json','w'))"`
   (thêm phố mới thì thêm id vào danh sách).
2. Độ khó bằng số (máy giỏi + người đặt bừa; người mới đặt gần đường):
   `npx esbuild tools/kiemtra/do_kho.ts --bundle --platform=node --outfile=node_modules/.cache/do_kho.cjs && node node_modules/.cache/do_kho.cjs <A>` → `<A>/dokho.json`
   `npx esbuild tools/kiemtra/nguoimoi.ts --bundle --platform=node --outfile=node_modules/.cache/nguoimoi.cjs && node node_modules/.cache/nguoimoi.cjs <A>` → `<A>/nguoimoi.json`
   Mục tiêu: máy giỏi thắng mọi màn; người mới thắng tiệm đầu phố ~55–80%, tiệm cuối ~30–55%, trùm ~20–35%.
3. Chơi trên trình duyệt thật + chụp ảnh (cần `npm run build` và `npx vite preview --port 4179`):
   `mkdir -p <A>/anh; for i in 0 1 2 3; do node tools/kiemtra/play.cjs <A> $i 4 & done; wait` → ảnh vào/giữa/cuối từng màn + `<A>/ketqua_*.json` (thắng/thua, lỗi).
   `python3 tools/kiemtra/ghep.py <A> $(python3 -c "import json;print(' '.join(json.load(open('<A>/ids.json'))))")` → `<A>/to/<id>.jpg` (3 ảnh ghép).
   Rồi chia ảnh theo phố cho trợ lý soi: ô bị che, đồ không hợp tiệm, chữ tràn, đường mờ…
4. Chụp nhanh 1 màn: `node tools/kiemtra/chup.cjs <A> <id>`; chụp lúc tung chiêu: `node tools/kiemtra/chup_chieu.cjs <A> <id>`.
