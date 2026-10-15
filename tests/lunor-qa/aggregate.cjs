'use strict';
// Collate real browser evidence. Missing artifacts are BLOCKED, not PASS.
const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps.json'), 'utf8')).apps;
const dir = path.resolve(process.env.LUNOR_QA_RESULTS || 'qa-results');
const reportDir = path.resolve('qa-report');
fs.mkdirSync(reportDir, { recursive: true });
const data = [];
const escapeCell = s => String(s || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 350);
for (const app of manifest) {
  let result = null;
  const folder = path.join(dir, 'lunor-qa-' + app.slug, 'status.json');
  try {
    result = JSON.parse(fs.readFileSync(folder, 'utf8'));
  } catch {}
  const errors = (result?.checks || []).filter(x => x.status === 'FAIL').map(x => x.name + ': ' + x.evidence);
  data.push({
    app: app.slug,
    name: app.name,
    bootStatus: result ? result.bootStatus : 'BLOCKED',
    checkPassed: result?.summary?.passed || 0,
    checkFailed: result?.summary?.failed || 0,
    roundtrip: result?.functionalFileRoundtrip || 'NOT_TESTED',
    errors,
    artifact: result ? 'lunor-qa-' + app.slug : 'missing',
    timestamp: result?.timestamp || null
  });
}
const ok = data.filter(d => d.bootStatus === 'PASS').length;
const fail = data.filter(d => d.bootStatus === 'FAIL').length;
const blocked = data.filter(d => d.bootStatus === 'BLOCKED').length;
const rows = [
  '# LUNOR Apps — QA Chặng 1 · Báo cáo Chromium',
  '',
  '> Kết quả của trình duyệt tại thời điểm thực thi. Không dùng build success để thay cho kiểm thử dữ liệu.',
  '',
  'Tổng số: **12** · Boot PASS: **' + ok + '** · Boot FAIL: **' + fail + '** · BLOCKED: **' + blocked + '**.',
  '',
  '| Ứng dụng | Khởi động Chromium | Kiểm tra đạt | Kiểm tra lỗi | Tạo/sửa/lưu/mở lại |',
  '|---|---|---:|---:|---|',
  ...data.map(d => '| ' + d.name + ' | **' + d.bootStatus + '** | ' + d.checkPassed + ' | ' + d.checkFailed + ' | ' + d.roundtrip + ' |'),
  '',
  '## Lỗi / bước bị chặn',
  ...data.flatMap(d => d.errors.length ? ['### ' + d.name, ...d.errors.map(e => '- ' + escapeCell(e))] : (d.bootStatus === 'BLOCKED' ? ['- ' + d.name + ': Không có artifact; kiểm tra runner/workflow'] : [])),
  '',
  '## Chưa đủ chứng cứ để phát hành',
  '- Tất cả 12 ứng dụng vẫn phải qua kiểm thử **tạo → sửa → lưu → đóng → mở lại → đối chiếu tệp**.',
  '- Kiểm thử trên LUNOR OS (Arch/Hyprland) và Windows thật vẫn chưa thực hiện qua workflow này.',
  '- Build WebAssembly thành công và ảnh chụp giao diện không chứng minh độ chính xác hoặc tính ổn định dài hạn.',
  '- Giữ nguyên nhánh production cho đến khi các lỗi P0/P1 được giải quyết.',
  '',
  '## Bằng chứng',
  'Mỗi app có artifact `lunor-qa-<app>` chứa `status.json` và (nếu mở được) `boot.png`.',
  ''
].join('\n');
fs.writeFileSync(path.join(reportDir, 'LUNOR_QA_REPORT.md'), rows);
fs.writeFileSync(path.join(reportDir, 'status-summary.json'), JSON.stringify({ timestamp: new Date().toISOString(), total: 12, pass: ok, fail, blocked, apps: data }, null, 2) + '\n');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
console.log('LUNOR QA: boot PASS ' + ok + ', FAIL ' + fail + ', BLOCKED ' + blocked);
process.exitCode = ok === 12 ? 0 : 1;
