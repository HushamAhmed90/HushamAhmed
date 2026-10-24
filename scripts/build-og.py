import json, html
from playwright.sync_api import sync_playwright
A='/home/claude/new/app'
items=json.load(open(A+'/scripts/og-ids.json'))+[{'id':'qa','title':'💬 سؤال وجواب عن المعاملات','short':'أسئلة العراقيين بألمانيا، وأجوبتها بكلام بسيط'}]
TPL='''<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:C;font-weight:400;src:url(file://%(A)s/fonts/cairo-regular.woff2)}
@font-face{font-family:C;font-weight:700;src:url(file://%(A)s/fonts/cairo-semibold.woff2)}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;font-family:C;color:#fff;background:radial-gradient(circle at 75%% 20%%,#24527f 0,#123150 60%%,#0b2238 100%%);padding:56px 70px;position:relative;overflow:hidden}
.top{display:flex;align-items:center;gap:18px}.top img{width:76px;border-radius:18px}.top b{font-size:38px}
.pill{position:absolute;left:70px;top:62px;background:#d6a93a;color:#1b2430;font-weight:700;font-size:30px;padding:6px 26px;border-radius:40px}
h1{font-size:%(fs)dpx;line-height:1.3;margin-top:70px;max-width:1060px}
p{font-size:36px;color:#cfdbe8;margin-top:22px;max-width:1060px;line-height:1.5}
.bar{position:absolute;bottom:0;left:0;right:0;height:14px;background:#d6a93a}
</style></head><body><div class="top"><img src="file://%(A)s/icons/icon-192.png"><b>هشام للمعاملات</b></div><div class="pill">دليل مجاني</div>
<h1>%(title)s</h1><p>%(short)s</p><div class="bar"></div></body></html>'''
with sync_playwright() as p:
    b=p.chromium.launch(args=['--allow-file-access-from-files']); pg=b.new_page(viewport={'width':1200,'height':630})
    for it in items:
        t=it['title']; fs=76 if len(t)<26 else 64
        open('/tmp/og.html','w').write(TPL%{'A':A,'title':html.escape(t),'short':html.escape(it['short']),'fs':fs})
        pg.goto('file:///tmp/og.html'); pg.wait_for_timeout(250)
        pg.screenshot(path=f"{A}/img/og/{it['id']}.jpg", type='jpeg', quality=86)
    b.close()
print(len(items))
