import sys,os
from PIL import Image
A=sys.argv[1]
for sid in sys.argv[2:]:
    ims=[Image.open(f'{A}/anh/{sid}_{n}.png') for n in ['1_vao','2_giua','3_cuoi'] if os.path.exists(f'{A}/anh/{sid}_{n}.png')]
    if len(ims)<3: continue
    w,h=ims[0].size
    out=Image.new('RGB',(w*3+20,h),'white')
    for i,im in enumerate(ims): out.paste(im,(i*(w+10),0))
    out=out.resize((out.width*3//4,out.height*3//4))
    out.save(f'{A}/to/{sid}.jpg',quality=80)
