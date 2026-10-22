import asyncio,sys,base64,json
sys.path.insert(0,"/workspace/.cache/hark-browser/py")
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/workspace/projects/536c6175-2b91-4d1e-8d3d-28210d8dbdd7/tools/chromium.sh',args=['--allow-file-access-from-files'])
        pg=await b.new_page();pg.on('pageerror',lambda e:print('ERR',e))
        await pg.goto('file:///workspace/work/v142u2/mask.html');await pg.wait_for_function('window.done')
        o=await pg.evaluate('window.out')
        for k,v in o.items():
            if k.endswith('_domes'):open(k+'.json','w').write(v)
            else:open(k+'.png','wb').write(base64.b64decode(v.split(',')[1]))
        await b.close()
asyncio.run(main())
