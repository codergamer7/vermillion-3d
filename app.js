import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// VERMILLION: REAL-TIME 3D WORLD DEMONSTRATION
// All geography, facilities and their locations are fictional concepts.
// Set world coordinates, content and scene parameters in this file.

const locations = [
  {id:'vermillion',name:'Vermillion City',type:'city',icon:'▥',sub:'The capital · Finance & culture',x:4,z:2,region:'Central Vermillion',kind:'National capital',description:'Vermillion’s national capital, featuring a dense contemporary skyline, waterfront promenades, business headquarters and modern civic architecture. The country’s energy revenues support its wider mixed economy.',label:true},
  {id:'harborview',name:'Harborview',type:'city',icon:'⌂',sub:'Luxury homes · Marina district',x:13,z:15,region:'South Coast',kind:'Residential & leisure',description:'An affluent hillside and waterfront community. Explore multistorey luxury villas, marina promenades, landscaped estates and the coastline’s modern residential architecture.',label:true},
  {id:'portmaren',name:'Port Maren',type:'city',icon:'◫',sub:'Container port · Oil exports',x:29,z:-3,region:'East Coast',kind:'Commercial port',description:'Vermillion’s principal shipping and petroleum-export hub. Modern terminals connect tankers and cargo ships with the country’s large international oil trade.',label:true},
  {id:'ravelle',name:'Ravelle',type:'city',icon:'◇',sub:'University · Technology research',x:12,z:-13,region:'North-Central',kind:'Education & research',description:'A technology-focused university city, home to advanced laboratories, innovative workplaces and clean-energy research linked to Vermillion’s energy transition.',label:true},
  {id:'northbay',name:'North Bay',type:'city',icon:'◉',sub:'Resorts · Coastal living',x:-23,z:-14,region:'Northwest Coast',kind:'Tourism & residential',description:'The island’s northern resort city. Beachfront districts, compact seaside neighborhoods and marinas sit beside the growing offshore-wind industry.',label:true},
  {id:'westridge',name:'Westridge',type:'city',icon:'⌂',sub:'Hillside villas · Smart estates',x:-29,z:3,region:'Western Hills',kind:'Luxury residential',description:'A landscaped hillside region known for understated contemporary villas, terraced developments, quiet streets and views toward Vermillion’s central highlands.',label:true},
  {id:'lakeside',name:'Lakeside',type:'city',icon:'≈',sub:'Lake · Green infrastructure',x:-6,z:-1,region:'Central Highlands',kind:'Residential & education',description:'An inland lakeside city linked to university campuses and the island’s growing solar-generation and energy-storage facilities.',label:true},
  {id:'clearwater',name:'Clearwater',type:'city',icon:'⌁',sub:'Beaches · Marine conservation',x:-22,z:16,region:'Southwest Coast',kind:'Coastal tourism',description:'A scenic coastal town with a broad sandy beach, small-scale resorts and a growing economy in conservation, fisheries and recreation.',label:true},
  {id:'sanridge',name:'Sanridge',type:'city',icon:'▤',sub:'Farms · Modern manufacturing',x:-5,z:17,region:'South-Central',kind:'Agriculture & manufacturing',description:'An inland production town supporting agriculture, food processing, specialized manufacturing and regional transport corridors.',label:true},
  {id:'eastpoint',name:'Eastpoint',type:'city',icon:'▥',sub:'Industry · Engineering',x:29,z:10,region:'Southeast',kind:'Energy services',description:'An industrial engineering city supporting oil operations, refining, freight movement and skilled technical employment.',label:true},
  {id:'offshore',name:'Vermillion Offshore Field',type:'energy',icon:'◈',sub:'Deepwater petroleum production',x:47,z:-10,region:'Eastern Offshore Waters',kind:'Oil extraction',description:'A conceptual offshore drilling and production platform. Vermillion’s massive international petroleum exports remain a dominant part of its economic identity.',label:true},
  {id:'terminal',name:'Port Maren Oil Terminal',type:'energy',icon:'▣',sub:'Tank farms · Export docks',x:35,z:-5,region:'Port Maren',kind:'Oil export terminal',description:'A major liquid-cargo facility with storage tanks and tanker berths supporting the country’s enormous volume of international crude-oil sales.',label:false},
  {id:'refinery',name:'Eastpoint Refinery',type:'energy',icon:'▧',sub:'Refining · Petrochemicals',x:32,z:8,region:'Eastpoint',kind:'Petroleum refining',description:'A petroleum processing site with industrial towers, pipes and supporting infrastructure. Its equipment is shown as a simplified 3D concept.',label:false},
  {id:'windfarm',name:'North Bay Wind Farm',type:'energy',icon:'✳',sub:'Turbines · Clean electricity',x:-16,z:-18,region:'North Bay Highlands',kind:'Wind power',description:'A group of wind turbines on Vermillion’s breezy northern ridge. Their animated blades illustrate the expanding renewable-energy industry.',label:true},
  {id:'solar',name:'Lakeside Solar Fields',type:'energy',icon:'▤',sub:'Photovoltaic arrays',x:-14,z:3,region:'Lakeside',kind:'Solar power',description:'Rows of solar panels convert the island’s abundant sunshine into electricity. Vermillion invests oil-derived wealth into new renewable generation.',label:false},
  {id:'battery',name:'Central Energy Storage',type:'energy',icon:'◧',sub:'Utility-scale storage',x:-10,z:8,region:'Central Vermillion',kind:'Battery storage',description:'A conceptual grid-scale energy storage site, designed to support intermittent solar and wind generation and improve electricity reliability.',label:false},
  {id:'marina',name:'Harborview Marina',type:'landmark',icon:'⚓',sub:'Yachts · Waterfront promenade',x:19,z:19,region:'Harborview',kind:'Marina & leisure',description:'An inviting waterfront marina with floating docks, private yachts, palm-lined walkways and fine-dining districts.',label:false},
  {id:'estates',name:'Westridge Luxury Estates',type:'landmark',icon:'⌂',sub:'Contemporary multistorey homes',x:-33,z:6,region:'Westridge',kind:'Luxury housing',description:'A cluster of spacious, multistorey smart homes with flat roofs, shaded terraces, warm natural finishes and tropical landscaping.',label:false},
  {id:'beach',name:'Clearwater Beach',type:'landmark',icon:'◒',sub:'Coastal recreation',x:-28,z:18,region:'Clearwater',kind:'Beach',description:'A wide beach with soft sands and clear shallows, next to a small resort district on the island’s southwestern shoreline.',label:false},
  {id:'airport',name:'Vermillion International Airport',type:'landmark',icon:'✈',sub:'Runway · International gateway',x:17,z:6,region:'Central-East',kind:'International airport',description:'A conceptual international airport serving tourism, business travel and trade, with a modern terminal and a visible runway.',label:false}
];
const locationById = Object.fromEntries(locations.map(l=>[l.id,l]));
const cityLocations = locations.filter(l=>l.type==='city');
const DEG=Math.PI/180;
const viewport=document.getElementById('viewport');
const overlay=document.getElementById('worldOverlay');
const loading=document.getElementById('loading');
let selected='vermillion', currentFilter='all', query='';
let dayMode=true, isStreet=false, isOrbit=false, transition=null;
const clickable=[];
const rotors=[];
const clock=new THREE.Clock();
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
const hoverPoint=new THREE.Vector3();

const scene=new THREE.Scene();
scene.background=new THREE.Color('#a4cdd7');
scene.fog=new THREE.FogExp2('#a9d3d9',0.00255);
const camera=new THREE.PerspectiveCamera(44,1,.1,850);
camera.position.set(72,76,89);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label','3D model of Vermillion. Drag to rotate and scroll to zoom.');
viewport.insertBefore(renderer.domElement,viewport.firstChild);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.07;
controls.minDistance=5;
controls.maxDistance=230;
controls.minPolarAngle=.10;
controls.maxPolarAngle=Math.PI/2-.035;
controls.screenSpacePanning=false;
controls.target.set(0,0,0);
controls.update();

const hemi=new THREE.HemisphereLight('#f2fbff','#7e9984',2.15);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff7e9',3.4);
sun.position.set(-47,95,48);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-85;sun.shadow.camera.right=85;
sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;
sun.shadow.camera.near=1;sun.shadow.camera.far=210;
sun.shadow.normalBias=.06;
scene.add(sun);
const fillLight=new THREE.DirectionalLight('#a8e6f9',.7);fillLight.position.set(32,36,-40);scene.add(fillLight);

const mats={
  concrete:new THREE.MeshStandardMaterial({color:'#c4d1cf',roughness:.89}),
  plaster:new THREE.MeshStandardMaterial({color:'#f5f3ec',roughness:.84}),
  cream:new THREE.MeshStandardMaterial({color:'#e6ddd0',roughness:.93}),
  charcoal:new THREE.MeshStandardMaterial({color:'#49545c',roughness:.77}),
  warmRoof:new THREE.MeshStandardMaterial({color:'#aa9985',roughness:.95}),
  darkRoof:new THREE.MeshStandardMaterial({color:'#4e6572',roughness:.88}),
  glass:new THREE.MeshStandardMaterial({color:'#6b9fb2',metalness:.31,roughness:.2,transparent:true,opacity:.9}),
  greenGlass:new THREE.MeshStandardMaterial({color:'#7bbab1',metalness:.25,roughness:.22}),
  timber:new THREE.MeshStandardMaterial({color:'#b28c65',roughness:.93}),
  steel:new THREE.MeshStandardMaterial({color:'#8599a1',metalness:.62,roughness:.47}),
  darkSteel:new THREE.MeshStandardMaterial({color:'#3b5660',metalness:.56,roughness:.48}),
  gold:new THREE.MeshStandardMaterial({color:'#c9ab69',metalness:.58,roughness:.4}),
  asphalt:new THREE.MeshStandardMaterial({color:'#5e7277',roughness:.96,side:THREE.DoubleSide}),
  pavement:new THREE.MeshStandardMaterial({color:'#aebcb6',roughness:.95}),
  whiteMark:new THREE.MeshStandardMaterial({color:'#f1eedb',roughness:.9}),
  treeTrunk:new THREE.MeshStandardMaterial({color:'#75624a',roughness:1}),
  canopy:new THREE.MeshStandardMaterial({color:'#477d58',roughness:1}),
  canopyLight:new THREE.MeshStandardMaterial({color:'#6c9d67',roughness:1}),
  palm:new THREE.MeshStandardMaterial({color:'#3d7852',roughness:.95,side:THREE.DoubleSide}),
  solar:new THREE.MeshStandardMaterial({color:'#1d466d',metalness:.7,roughness:.17,side:THREE.DoubleSide}),
  solarGrid:new THREE.MeshStandardMaterial({color:'#7399a8',metalness:.5,roughness:.4}),
  runway:new THREE.MeshStandardMaterial({color:'#6e7978',roughness:1}),
  dirt:new THREE.MeshStandardMaterial({color:'#9c9780',roughness:1}),
  white:new THREE.MeshStandardMaterial({color:'#eef4ef',roughness:.93}),
  watercraft:new THREE.MeshStandardMaterial({color:'#eae9df',roughness:.85}),
};
const geoBox=new THREE.BoxGeometry(1,1,1);
const geoPlane=new THREE.PlaneGeometry(1,1);
const geoSphere=new THREE.SphereGeometry(1,10,8);
const geoCylinder=new THREE.CylinderGeometry(1,1,1,10);
const geoCone=new THREE.ConeGeometry(1,1,8);
const geoPlane2=new THREE.PlaneGeometry(1,1);
function mesh(geometry,material,parent=scene){const obj=new THREE.Mesh(geometry,material);parent.add(obj);return obj;}
function box(w,h,d,x,y,z,mat,parent=scene){const m=mesh(geoBox,mat,parent);m.position.set(x,y,z);m.scale.set(w,h,d);return m;}
function cylinder(r1,r2,h,x,y,z,mat,parent=scene){const g=new THREE.CylinderGeometry(r1,r2,h,12);const m=mesh(g,mat,parent);m.position.set(x,y,z);return m;}
function ball(r,x,y,z,mat,parent=scene){const m=mesh(geoSphere,mat,parent);m.position.set(x,y,z);m.scale.setScalar(r);return m;}
function addInteractive(obj,id){obj.userData.locationId=id;clickable.push(obj);return obj;}
function seeded(a){const s=Math.sin(a*127.1+28.35)*43758.5453;return s-Math.floor(s);}
function lerp(a,b,t){return a+(b-a)*t;}
function coastX(t){return 44.5*(1+.038*Math.sin(3*t)+.034*Math.cos(5*t)-.026*Math.sin(7*t));}
function coastZ(t){return 28.0*(1+.055*Math.cos(4*t)+.025*Math.sin(9*t));}
function coastR(x,z){const a=Math.atan2(z/28,x/44.5);return Math.hypot(x/coastX(a),z/coastZ(a));}
function gaussian(x,z,cx,cz,sx,sz){return Math.exp(-((x-cx)**2/(2*sx*sx)+(z-cz)**2/(2*sz*sz)));}
function terrainHeight(x,z){
 const r=coastR(x,z);
 const shore=1.1*Math.pow(Math.max(0,1-r),1.1);
 const mountain=6.1*gaussian(x,z,-9,-9,13,8)+3.9*gaussian(x,z,5,-13,10,7)+1.75*gaussian(x,z,-29,0,7,6);
 const rolling=.28*Math.sin(x*.36+Math.cos(z*.15))+.22*Math.cos(z*.39)+.12*Math.sin(x*.78+z*.41);
 return Math.max(.12,.35+shore+mountain*Math.pow(Math.max(0,1-r),.42)+rolling*Math.max(.1,1-r));
}
function groundY(x,z){return coastR(x,z)>1?-.2:terrainHeight(x,z);}
// Island elevation mesh with beach, greenery, hills, and a natural coastline.
const steps=160,rings=38;
const verts=[],colors=[],indices=[];
const sand=new THREE.Color('#dfd0ad'),low=new THREE.Color('#b3c998'),mid=new THREE.Color('#8dad79'),high=new THREE.Color('#728b77'),rock=new THREE.Color('#7e8b80');
for(let ri=0;ri<=rings;ri++){
 const r=ri/rings;
 for(let i=0;i<=steps;i++){
  const a=i/steps*Math.PI*2;
  const x=Math.cos(a)*coastX(a)*r;
  const z=Math.sin(a)*coastZ(a)*r;
  const y=terrainHeight(x,z);
  verts.push(x,y,z);
  const c=new THREE.Color();
  if(r>.955)c.copy(sand);
  else if(r>.87)c.copy(sand).lerp(low,(.955-r)/.085);
  else if(y>6)c.copy(high).lerp(rock,Math.min(1,(y-6)/3));
  else if(y>3)c.copy(mid).lerp(high,(y-3)/3);
  else c.copy(low).lerp(mid,.31+seeded(i+ri*129)*.28);
  colors.push(c.r,c.g,c.b);
 }
}
for(let r=0;r<rings;r++)for(let i=0;i<steps;i++){
 const a=r*(steps+1)+i,b=a+steps+1;
 indices.push(a,a+1,b,a+1,b+1,b);
}
const islandGeo=new THREE.BufferGeometry();
islandGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
islandGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
islandGeo.setIndex(indices);islandGeo.computeVertexNormals();
const island=mesh(islandGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
island.receiveShadow=true;
// Shoreline breakwater gives visible relief from orbit camera.
const skirtVerts=[],skirtIndices=[];
for(let i=0;i<=steps;i++){
 const a=i/steps*Math.PI*2;const x=Math.cos(a)*coastX(a),z=Math.sin(a)*coastZ(a);
 skirtVerts.push(x,terrainHeight(x,z),z,x,-1.4,z);
 if(i<steps){const j=2*i;skirtIndices.push(j,j+2,j+1,j+2,j+3,j+1);}
}
const skirtGeo=new THREE.BufferGeometry();skirtGeo.setAttribute('position',new THREE.Float32BufferAttribute(skirtVerts,3));skirtGeo.setIndex(skirtIndices);skirtGeo.computeVertexNormals();
mesh(skirtGeo,new THREE.MeshStandardMaterial({color:'#b6b29a',roughness:.98,side:THREE.DoubleSide}));

// Lightly animated ocean surface; no satellite imagery or third-party map data.
const waterTextureCanvas=document.createElement('canvas');waterTextureCanvas.width=256;waterTextureCanvas.height=256;
const ctx=waterTextureCanvas.getContext('2d');ctx.fillStyle='#a4d4dc';ctx.fillRect(0,0,256,256);
for(let i=0;i<250;i++){
 const x=seeded(i*2.3)*256,y=seeded(i*9.1+4)*256;
 ctx.strokeStyle=`rgba(246,255,252,${.04+seeded(i*15)*.08})`;
 ctx.lineWidth=seeded(i*7)*1.6+.3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8+seeded(i)*37,y-1);ctx.stroke();
}
const waterTex=new THREE.CanvasTexture(waterTextureCanvas);
waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;waterTex.repeat.set(20,20);
const oceanMat=new THREE.MeshStandardMaterial({color:'#8ac2d5',map:waterTex,transparent:false,metalness:.12,roughness:.44,side:THREE.DoubleSide});
const water=mesh(new THREE.PlaneGeometry(1300,1300,1,1),oceanMat);
water.rotation.x=-Math.PI/2;water.position.y=-.22;water.receiveShadow=true;
// Island shallow ring adds a turquoise glow along the coast.
const shallowMat=new THREE.MeshStandardMaterial({color:'#79c8ce',metalness:0,roughness:.75,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false});
const coastalRing=mesh(new THREE.RingGeometry(44,46,140),shallowMat);coastalRing.rotation.x=-Math.PI/2;coastalRing.position.y=-.16;coastalRing.scale.set(1,.64,1);

function roadSegment(points,width=1.1,material=mats.asphalt,drawDashes=true){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'catmullrom',.14);
 const N=Math.max(35,points.length*18),p=[],inds=[];
 for(let i=0;i<=N;i++){
  const t=i/N,pos=curve.getPoint(t),prev=curve.getPoint(Math.max(0,t-.003)),next=curve.getPoint(Math.min(1,t+.003));
  let dx=next.x-prev.x,dz=next.z-prev.z;const len=Math.hypot(dx,dz)||1;
  const nx=-dz/len,nz=dx/len,y=groundY(pos.x,pos.z)+.13;
  p.push(pos.x+nx*width/2,y,pos.z+nz*width/2,pos.x-nx*width/2,y,pos.z-nz*width/2);
  if(i<N){let j=i*2;inds.push(j,j+1,j+2,j+1,j+3,j+2);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(inds);geo.computeVertexNormals();
 mesh(geo,material).receiveShadow=true;
 if(drawDashes && width>1){
  for(let i=5;i<N-3;i+=10){
   const t=i/N,pos=curve.getPoint(t),dir=curve.getTangent(t);const m=box(.1,.028,.63,pos.x,groundY(pos.x,pos.z)+.18,pos.z,mats.whiteMark);
   m.rotation.y=Math.atan2(dir.x,dir.z);
  }
 }
}
const cityPos=id=>[locationById[id].x,locationById[id].z];
// Roads connecting every established city across one continuous island.
[
 ['northbay','lakeside','vermillion','portmaren'],
 ['westridge','lakeside','ravelle'],
 ['clearwater','westridge','vermillion','harborview'],
 ['sanridge','vermillion','eastpoint'],
 ['northbay','westridge','clearwater'],
 ['ravelle','portmaren','eastpoint','harborview'],
 ['sanridge','harborview'],
 ['lakeside','sanridge']
].forEach((path,i)=>roadSegment(path.map(cityPos),i<3?1.3:.94,mats.asphalt,i<3));

// BUILDINGS
const residentialMaterials=[mats.plaster,mats.cream,mats.concrete,mats.warmRoof];
const glassPatterns=[mats.glass,mats.greenGlass];
function modelBuilding(x,z,width,depth,height,kind='residential',id=null,seed=1){
 const y=groundY(x,z);
 if(y<0 || coastR(x,z)>.91)return;
 const g=new THREE.Group();g.position.set(x,y+.04,z);scene.add(g);
 let bodyMaterial;
 if(kind==='tower')bodyMaterial=seeded(seed*1.4)>.52?mats.concrete:mats.plaster;
 else bodyMaterial=residentialMaterials[Math.floor(seeded(seed)*residentialMaterials.length)];
 const body=box(width,height,depth,0,height/2,0,bodyMaterial,g);
 body.castShadow=true;body.receiveShadow=true;
 if(id)addInteractive(body,id);
 const roof=box(width+.18,.13,depth+.16,0,height+.09,0,kind==='villa'?mats.darkRoof:mats.concrete,g);if(id)addInteractive(roof,id);
 if(kind==='villa'){
  // set-back terrace, timber, balcony and deep window bands
  box(width*.69,.21,depth*.43,0,height*.59,depth*.31,mats.plaster,g);
  box(width*.67,.22,depth*.07,0,height*.64,depth*.53,mats.glass,g);
  box(width*.5,height*.22,.055,0,height*.32,depth/2+.032,mats.glass,g);
  box(width*.62,height*.13,.052,0,height*.79,depth/2+.034,mats.glass,g);
  box(width*.18,height*.21,.08,-width*.35,height*.31,depth/2+.06,mats.timber,g);
 }else{
  const floors=kind==='tower'?Math.min(17,Math.max(3,Math.round(height/1.7))):Math.min(5,Math.floor(height/1.5));
  const rowWidth=width*.72;const glassDepth=.04;
  for(let f=0;f<floors;f++){
   const yy=Math.min(height-.4,(f+.55)*(height/floors));
   box(rowWidth,Math.max(.12,height/floors*.35),glassDepth,0,yy,depth/2+.035,glassPatterns[(f+seed)%2|0],g);
   if(kind==='tower')box(glassDepth,Math.max(.12,height/floors*.34),depth*.65,width/2+.035,yy,0,mats.glass,g);
  }
  if(kind==='tower' && height>11){
   box(width*.75,.28,depth*.75,0,height+.36,0,mats.darkRoof,g);
   if(seeded(seed*11)>.67)box(.12,2,.12,0,height+1.45,0,mats.steel,g);
  }
 }
 return g;
}
// Arranged by type and local density so neighborhoods remain distinct.
function neighborhood(id,count,spreadX,spreadZ,style){
 const l=locationById[id];
 const theta=(seeded(count+id.length)*.2-.1);
 for(let i=0;i<count;i++){
  const ix=(seeded(i*12.79+id.length*4)-.5)*spreadX*2;
  const iz=(seeded(i*19.75+id.length*9)-.5)*spreadZ*2;
  const x=l.x+ix,z=l.z+iz;
  if(coastR(x,z)>.86 || Math.hypot(ix,iz)<1.7)continue;
  const d=Math.hypot(ix/spreadX,iz/spreadZ);
  const main=style==='capital' && d<.7 && seeded(i*2.7)>.39;
  const tower=main||style==='urban'&&seeded(i*3.1)>.79;
  const villa=style==='luxury' || style==='coast' || style==='suburb'&&seeded(i*2)>.3;
  const w=tower?lerp(.85,1.9,seeded(i*8.7)):lerp(.78,1.55,seeded(i*5.3));
  const dep=tower?lerp(.85,1.8,seeded(i*7.7)):lerp(.95,1.9,seeded(i*4.9));
  const h=tower?lerp(7,style==='capital'?23:14,seeded(i*9.73)):villa?lerp(1.7,3.9,seeded(i*4.2)):lerp(2.3,6.7,seeded(i*3.8));
  const b=modelBuilding(x,z,w,dep,h,tower?'tower':villa?'villa':'residential',id,i+id.length*13);
  if(b)b.rotation.y=theta+(.08*Math.round(seeded(i*23.1)*8));
 }
}
neighborhood('vermillion',114,8.4,6.9,'capital');
neighborhood('ravelle',65,6.2,5.7,'urban');
neighborhood('portmaren',46,6,4.3,'urban');
neighborhood('eastpoint',38,5.3,4.2,'urban');
neighborhood('harborview',63,7.1,5,'luxury');
neighborhood('westridge',57,7.3,6.1,'luxury');
neighborhood('northbay',48,6,5.2,'coast');
neighborhood('clearwater',39,5.9,3.7,'coast');
neighborhood('lakeside',38,5.1,3.8,'suburb');
neighborhood('sanridge',34,5.4,4.2,'suburb');

// Urban tree canopy rendered with instances for performance.
const treeCount=290,treeLocations=[];
for(let i=0;i<treeCount*5 && treeLocations.length<treeCount;i++){
 const x=(seeded(i*1.243)-.5)*88,z=(seeded(i*5.81)-.5)*57;
 if(coastR(x,z)>.89 || coastR(x,z)<.12)continue;
 if(cityLocations.some(c=>Math.hypot(x-c.x,z-c.z)<3.4))continue;
 if(Math.abs(groundY(x,z))>8)continue;
 treeLocations.push([x,z]);
}
const treeStem=new THREE.InstancedMesh(new THREE.CylinderGeometry(.085,.11,.78,5),mats.treeTrunk,treeLocations.length);
const treeCrown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.8,0),mats.canopy,treeLocations.length);
const tmp=new THREE.Object3D();
treeLocations.forEach(([x,z],i)=>{
 const y=groundY(x,z),scale=.6+seeded(i*6.9)*.8;
 tmp.position.set(x,y+.38*scale,z);tmp.scale.set(scale,scale,scale);tmp.rotation.set(0,0,0);tmp.updateMatrix();treeStem.setMatrixAt(i,tmp.matrix);
 tmp.position.y=y+1.1*scale;tmp.scale.set(scale*.8,scale*.92,scale*.8);tmp.updateMatrix();treeCrown.setMatrixAt(i,tmp.matrix);
});
treeStem.instanceMatrix.needsUpdate=true;treeCrown.instanceMatrix.needsUpdate=true;
treeCrown.castShadow=false;scene.add(treeStem,treeCrown);

// Grouped industries can be clicked directly in 3D.
function groupBase(id){const loc=locationById[id];const grp=new THREE.Group();grp.position.set(loc.x,groundY(loc.x,loc.z)+.15,loc.z);scene.add(grp);return grp;}
function makeWindTurbine(x,z,id){
 const y=groundY(x,z);const grp=new THREE.Group();grp.position.set(x,y,z);scene.add(grp);
 const pole=cylinder(.13,.22,6.6,0,3.3,0,mats.white,grp);addInteractive(pole,id);
 const nacelle=box(.88,.36,.44,0,6.7,0,mats.white,grp);addInteractive(nacelle,id);
 const rotor=new THREE.Group();rotor.position.set(-.53,6.72,0);grp.add(rotor);
 const hub=cylinder(.18,.16,.35,0,0,0,mats.white,rotor);hub.rotation.z=Math.PI/2;
 for(let i=0;i<3;i++){
  const blade=box(.2,2.45,.09,0,1.36,0,mats.white,rotor);blade.position.y=1.27;blade.rotation.z=i*Math.PI*2/3; // rotate individual blades around their own centers below
  const pivot=new THREE.Group();rotor.add(pivot);rotor.remove(blade);pivot.rotation.x=0;pivot.rotation.z=i*Math.PI*2/3;pivot.add(blade);blade.rotation.z=0;
 }
 rotor.rotation.y=Math.PI/2;
 rotors.push(rotor);
}
for(let i=0;i<5;i++)makeWindTurbine(-19+i*2.4,-19+(i%2)*2,'windfarm');

function solarField(){
 const grp=groupBase('solar');
 const pad=box(12,.08,7,0,.03,0,mats.dirt,grp);addInteractive(pad,'solar');
 for(let row=0;row<6;row++)for(let col=0;col<10;col++){
  const px=-5.1+col*1.13,pz=-3.0+row*1.12;
  const frame=box(.96,.065,.67,px,.6,pz,mats.darkSteel,grp);frame.rotation.x=-.3;
  const panel=box(.88,.025,.61,px,.65,pz,mats.solar,grp);panel.rotation.x=-.3;addInteractive(panel,'solar');
  if(col%3===0)box(.055,.48,.05,px,.29,pz,mats.steel,grp);
 }
}
solarField();
function batteryFacility(){
 const g=groupBase('battery');
 for(let i=0;i<8;i++){
  const m=box(1.5,1.15,.85,(i%4)*1.75-2.7,.65,Math.floor(i/4)*1.2-.7,mats.white,g);addInteractive(m,'battery');
  box(1.22,.38,.03,(i%4)*1.75-2.7,.74,Math.floor(i/4)*1.2-.7+.46,mats.darkSteel,g);
 }
}
batteryFacility();
function tankFarm(){
 const g=groupBase('terminal');
 const pad=box(10,.10,8,0,.02,0,mats.concrete,g);addInteractive(pad,'terminal');
 for(let i=0;i<10;i++){
  const x=-3.8+(i%5)*1.85,z=-1.8+Math.floor(i/5)*2.3;
  const tank=cylinder(.7,.7,1.1,x,.66,z,mats.plaster,g);addInteractive(tank,'terminal');
  cylinder(.7,.7,.07,x,1.27,z,mats.darkRoof,g);
 }
 // dock and pipe racks
 box(1.2,.3,9,5.6,.3,1,mats.steel,g);
 box(.16,1.4,7,4.6,1.1,0,mats.darkSteel,g);
}
tankFarm();
function refinery(){
 const g=groupBase('refinery');const pad=box(8,.08,7,0,.04,0,mats.dirt,g);addInteractive(pad,'refinery');
 for(let i=0;i<6;i++){
  const x=-2.9+(i%3)*2.5,z=-1.8+Math.floor(i/3)*3.3;
  const h=3+seeded(i*12)*4;
  const tower=cylinder(.45,.54,h,x,h/2+.09,z,mats.steel,g);addInteractive(tower,'refinery');
  cylinder(.55,.55,.13,x,h+.1,z,mats.darkRoof,g);
 }
 for(let i=0;i<4;i++){
  const pipe=box(6,.12,.12,0,1.1+i*.56,-3,mats.gold,g);addInteractive(pipe,'refinery');
 }
 box(7,.2,3.2,0,.35,3.1,mats.concrete,g);
}
refinery();
function offshorePlatform(){
 const g=groupBase('offshore');g.position.y=-.2;
 for(const x of [-1.9,1.9])for(const z of [-1.5,1.5]){
  const leg=box(.32,8,.32,x,2.4,z,mats.steel,g);addInteractive(leg,'offshore');
 }
 const deck=box(5.5,.62,4.4,0,6.3,0,mats.gold,g);addInteractive(deck,'offshore');
 box(4.9,.1,3.9,0,6.72,0,mats.charcoal,g);
 for(let l=0;l<4;l++){
  const yy=7.1+l*1.55;
  const wx=1.7-l*.39;
  box(wx*2,.13,.12,0,yy,-.85,mats.steel,g);
  box(.11,1.55,.11,wx,yy+.8,-.85,mats.steel,g);
  box(.11,1.55,.11,-wx,yy+.8,-.85,mats.steel,g);
 }
 cylinder(.35,.35,3.4,-2.05,8.7,1.3,mats.darkSteel,g);
 box(2,1.1,1.5,1,7.3,1.0,mats.white,g);
 const flare=ball(.25,-2.05,10.55,1.3,new THREE.MeshBasicMaterial({color:'#ffb25c'}),g);
 const flareLight=new THREE.PointLight('#ffc28c',1.8,10);flareLight.position.copy(flare.position);g.add(flareLight);
}
offshorePlatform();

function harbor(){
 const loc=locationById.marina;
 const dockMat=mats.timber;
 for(let i=0;i<5;i++){
  const x=loc.x-4+i*1.3,z=loc.z+.3;
  const dock=box(.25,.12,5,x,-.02,z,dockMat);addInteractive(dock,'marina');
  const hull=box(.7,.55,1.8,x+.6,-.07,z+1.2,mats.white);addInteractive(hull,'marina');
  box(.4,.47,.75,x+.6,.36,z+.85,mats.glass);
 }
}
harbor();
function oilTanker(x,z,id){
 const g=new THREE.Group();g.position.set(x,-.07,z);scene.add(g);
 const hull=box(4,1.25,12,0,-.22,0,mats.darkSteel,g);addInteractive(hull,id);
 const superstructure=box(3,2,2.8,0,1.13,4,mats.plaster,g);addInteractive(superstructure,id);
 for(let i=0;i<6;i++)cylinder(.77,.77,.8,0,.85,-4.7+i*1.6,mats.gold,g);
 g.rotation.y=.2;
}
oilTanker(42,-6.4,'terminal');
function createPortCrane(x,z,id){
 const y=groundY(x,z);const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
 const pole=box(.25,6,.3,0,3,0,mats.gold,g);addInteractive(pole,id);
 box(5,.22,.24,-1.8,6,0,mats.gold,g);
 box(.09,2,.09,-4.1,4.9,0,mats.darkSteel,g);
 box(.6,.3,.4,-4.1,3.9,0,mats.steel,g);
}
for(let i=0;i<3;i++)createPortCrane(32+i*2.1,-9.1,'portmaren');
function airport(){
 const l=locationById.airport,y=groundY(l.x,l.z);
 const pad=box(13,.07,2.3,l.x,y+.12,l.z,mats.runway);pad.rotation.y=.23;addInteractive(pad,'airport');
 const term=box(4,1.2,2,l.x,y+.8,l.z+2.5,mats.plaster);addInteractive(term,'airport');
 const roof=box(4.3,.15,2.1,l.x,y+1.55,l.z+2.5,mats.darkRoof);addInteractive(roof,'airport');
 for(let i=-5;i<=5;i++){
  const marker=box(.43,.03,.065,l.x+i*1.04,y+.17,l.z,mats.whiteMark);marker.rotation.y=.23;
 }
}
airport();
function palmTree(x,z,id){
 const y=groundY(x,z);
 const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
 const stem=cylinder(.08,.1,2.7,0,1.35,0,mats.treeTrunk,g);if(id)addInteractive(stem,id);
 for(let i=0;i<7;i++){
  const f=box(1.6,.07,.33,.6,2.75,0,mats.palm,g);f.rotation.y=i*Math.PI*2/7;f.rotation.z=-.28;
  // offset is local before radial rotation
  f.position.set(Math.cos(i*Math.PI*2/7)*.69,2.75,Math.sin(i*Math.PI*2/7)*.69);
 }
}
for(let i=0;i<14;i++){
 const x=locationById.harborview.x-4+(i%7)*1.2,z=locationById.harborview.z+3.3+Math.floor(i/7)*1.8;
 if(coastR(x,z)<.95)palmTree(x,z,'harborview');
}
for(let i=0;i<9;i++){
 const x=-27+i*1.3,z=18+(i%2)*.45;if(coastR(x,z)<.95)palmTree(x,z,'beach');
}
// Small glowing points imply a functioning modern coastline after sunset.
const lights=[];
for(const city of cityLocations){
 const p=new THREE.PointLight('#ffd4a0',0,17,2);
 p.position.set(city.x,groundY(city.x,city.z)+5,city.z);
 scene.add(p);lights.push(p);
}

// UI LISTS, SEARCH AND FILTERS
const dest=document.getElementById('destinations');
const search=document.getElementById('search');
const sidebar=document.getElementById('sidebar');
const detail=document.getElementById('detailCard');
function matches(l){
 const f=currentFilter==='all'||currentFilter===l.type||currentFilter==='energy'&&l.type==='energy';
 return f&&[l.name,l.sub,l.region,l.kind,l.description].join(' ').toLowerCase().includes(query);
}
function renderList(){
 const filtered=locations.filter(matches);
 document.getElementById('resultCount').textContent=`${filtered.length} LOCATION${filtered.length!==1?'S':''}`;
 dest.replaceChildren();
 if(!filtered.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='No locations matched your search. Try “oil”, “harbor” or “wind”.';dest.appendChild(empty);return;}
 for(const l of filtered){
  const b=document.createElement('button');b.className=`dest ${selected===l.id?'active':''}`;b.type='button';b.setAttribute('role','listitem');b.dataset.id=l.id;
  const i=document.createElement('span');i.className=`dest-icon ${l.type}`;i.textContent=l.icon;
  const t=document.createElement('span');t.className='dest-copy';
  const title=document.createElement('strong');title.textContent=l.name;
  const sub=document.createElement('small');sub.textContent=l.sub;t.append(title,sub);
  const arrow=document.createElement('span');arrow.className='dest-arrow';arrow.textContent='›';
  b.append(i,t,arrow);b.addEventListener('click',()=>selectLocation(l.id));dest.appendChild(b);
 }
}
function openDetail(l){
 document.getElementById('detailCategory').textContent=l.type==='city'?'CITY DISTRICT':l.type==='energy'?'NATIONAL ENERGY NETWORK':'FEATURED DESTINATION';
 document.getElementById('detailName').textContent=l.name;
 document.getElementById('detailSubtitle').textContent=l.sub;
 document.getElementById('detailDescription').textContent=l.description;
 document.getElementById('detailType').textContent=l.kind;
 document.getElementById('detailRegion').textContent=l.region;
 detail.hidden=false;
}
function moveCamera(position,target,duration=1.4){
 transition={startPosition:camera.position.clone(),startTarget:controls.target.clone(),endPosition:position.clone(),endTarget:target.clone(),elapsed:0,duration};
 controls.autoRotate=false;isOrbit=false;document.getElementById('orbitBtn').classList.remove('active');document.getElementById('orbitBtn').setAttribute('aria-pressed','false');
}
function selectLocation(id,street=false){
 const l=locationById[id];if(!l)return;
 selected=id;openDetail(l);renderList();
 isStreet=street;
 const y=groundY(l.x,l.z);
 const target=new THREE.Vector3(l.x,y+(street?1.7:1),l.z);
 const v=street?new THREE.Vector3(6,2.3,7):new THREE.Vector3(11,17,19);
 if(id==='offshore')v.set(14,15,23);
 moveCamera(target.clone().add(v),target,1.5);
 if(window.innerWidth<=560)sidebar.classList.add('collapsed');
}
function resetCamera(){
 isStreet=false;selected=null;detail.hidden=true;renderList();moveCamera(new THREE.Vector3(72,76,89),new THREE.Vector3(0,0,0),1.65);
 sidebar.classList.add('collapsed');
 if(window.innerWidth>800)sidebar.classList.remove('collapsed');
}
dest.addEventListener('pointerdown',e=>e.stopPropagation());
search.addEventListener('input',()=>{query=search.value.toLowerCase().trim();renderList();});
search.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=locations.find(matches);if(first)selectLocation(first.id);}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==search){e.preventDefault();search.focus();}if(e.key==='Escape'){detail.hidden=true;search.blur();}});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
 currentFilter=btn.dataset.filter;
 document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));renderList();
}));
document.getElementById('detailClose').addEventListener('click',()=>detail.hidden=true);
document.getElementById('exploreHere').addEventListener('click',()=>{if(selected)selectLocation(selected,true);});
document.getElementById('homeBtn').addEventListener('click',resetCamera);
document.getElementById('streetBtn').addEventListener('click',()=>selectLocation(selected||'vermillion',true));
document.getElementById('zoomIn').addEventListener('click',()=>camera.position.lerp(controls.target,.21));
document.getElementById('zoomOut').addEventListener('click',()=>camera.position.addScaledVector(camera.position.clone().sub(controls.target),.29));
document.getElementById('togglePanel').addEventListener('click',()=>sidebar.classList.toggle('collapsed'));
document.getElementById('orbitBtn').addEventListener('click',e=>{
 isOrbit=!isOrbit;controls.autoRotate=isOrbit;controls.autoRotateSpeed=.33;
 e.currentTarget.classList.toggle('active',isOrbit);e.currentTarget.setAttribute('aria-pressed',String(isOrbit));
});
document.getElementById('timeBtn').addEventListener('click',()=>{
 dayMode=!dayMode;
 const day=dayMode;
 scene.background.set(day?'#a4cdd7':'#283f56');
 scene.fog.color.set(day?'#a9d3d9':'#435868');
 sun.intensity=day?3.4:.62;hemi.intensity=day?2.15:.81;fillLight.intensity=day?.7:.4;
 renderer.toneMappingExposure=day?1.35:.99;
 lights.forEach(l=>l.intensity=day?0:8);
 document.getElementById('timeLabel').textContent=day?'Evening':'Daylight';
 document.getElementById('timeIcon').textContent=day?'☾':'☼';
});

// Position interactive city labels in perspective without a map API.
const labelLocations=locations.filter(l=>l.label);
const labelNodes=new Map();
for(const l of labelLocations){
 const b=document.createElement('button');b.className=`world-label ${l.type}`;b.type='button';b.textContent=l.name;b.title=`View ${l.name}`;
 b.addEventListener('click',()=>selectLocation(l.id));overlay.appendChild(b);labelNodes.set(l.id,b);
}
function updateLabels(){
 const r=renderer.domElement.getBoundingClientRect();
 const cameraDir=new THREE.Vector3();camera.getWorldDirection(cameraDir);
 const candidates=[];
 for(const l of labelLocations){
  const el=labelNodes.get(l.id),world=new THREE.Vector3(l.x,groundY(l.x,l.z)+4.4,l.z);
  const to=world.clone().sub(camera.position);
  if(to.dot(cameraDir)<=0){el.style.display='none';continue;}
  const projected=world.project(camera),sx=(projected.x*.5+.5)*r.width,sy=(-projected.y*.5+.5)*r.height;
  const far=world.distanceTo(camera.position);
  if(sx<10||sx>r.width-10||sy<80||sy>r.height-45||far>175){el.style.display='none';continue;}
  if(currentFilter!=='all'&&!matches(l)&&selected!==l.id){el.style.display='none';continue;}
  if(query&&!matches(l)&&selected!==l.id){el.style.display='none';continue;}
  candidates.push({l,el,sx,sy,far});
 }
 candidates.sort((a,b)=>a.l.id===selected?-1:b.l.id===selected?1:a.far-b.far);
 const used=[];
 const max=window.innerWidth<560?5:window.innerWidth<940?8:12;
 for(const c of candidates){
  const overlaps=used.some(p=>Math.abs(p.sx-c.sx)<105&&Math.abs(p.sy-c.sy)<31);
  if(used.length>=max || overlaps){c.el.style.display='none';continue;}
  c.el.style.display='flex';c.el.style.left=c.sx+'px';c.el.style.top=c.sy+'px';
  c.el.classList.toggle('active',c.l.id===selected);used.push(c);
 }
}

// 3D BUILDING RAYCAST SELECTION (click without dragging orbit camera).
let pointerDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!pointerDown)return;
 const moved=Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y);
 pointerDown=null;if(moved>6)return;
 const rect=renderer.domElement.getBoundingClientRect();
 pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(clickable,false);
 if(hits.length){const id=hits[0].object.userData.locationId;if(id)selectLocation(id);}
});

// On small screens, initially show the world unobstructed.
if(window.innerWidth<=800)sidebar.classList.add('collapsed');
renderList();
function resize(){
 const w=viewport.clientWidth,h=viewport.clientHeight;
 if(w<1||h<1)return;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
const resizer=new ResizeObserver(resize);resizer.observe(viewport);resize();
const fadeLoading=()=>{loading.classList.add('hidden');setTimeout(()=>loading.remove(),1100);};
requestAnimationFrame(fadeLoading);

function loop(){
 requestAnimationFrame(loop);
 const dt=Math.min(clock.getDelta(),.055);
 waterTex.offset.x+=dt*.004;waterTex.offset.y-=dt*.0018;
 rotors.forEach((r,i)=>r.rotation.x+=dt*(.4+i*.04));
 if(transition){
  transition.elapsed+=dt;
  const t=Math.min(1,transition.elapsed/transition.duration),ease=t*t*(3-2*t);
  camera.position.lerpVectors(transition.startPosition,transition.endPosition,ease);
  controls.target.lerpVectors(transition.startTarget,transition.endTarget,ease);
  if(t>=1)transition=null;
 }
 controls.update();
 renderer.render(scene,camera);
 updateLabels();
}
loop();
