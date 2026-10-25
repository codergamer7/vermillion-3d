import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COAST, LAND_POINTS, LAND_TRIANGLES } from './island-data.js';

// VERMILLION V2 — terrain derived from the provided island reference.
// Architecture and economic installations are fictional, not geographic data.
const PX = (p) => (p-725)/5.65;
const PZ = (p) => (p-510)/5.65;
const point = (x,y) => [PX(x),PZ(y)];
const CITY = [
 {id:'vermillion',name:'Vermillion City',type:'city',icon:'▥',sub:'Capital · Skyline · Financial core',at:[742,625],region:'South-central coast',kind:'National capital',description:'Vermillion’s coastal capital has a modern skyline, public waterfront, finance district and headquarters for the country’s petroleum and renewable-energy industries.',label:true},
 {id:'northbay',name:'North Bay',type:'city',icon:'☼',sub:'North coast · Resorts',at:[450,157],region:'North coast',kind:'Resort city',description:'A breezy northern city with resort neighborhoods, a waterfront district and access to the national wind-power network.',label:true},
 {id:'ravelle',name:'Ravelle',type:'city',icon:'◇',sub:'Technology · Universities',at:[681,295],region:'North-central highlands',kind:'Technology and education',description:'Ravelle combines university campuses, laboratories and technology employers with green hillside suburbs.',label:true},
 {id:'westridge',name:'Westridge',type:'city',icon:'⌂',sub:'Luxury estates · Westhaven',at:[249,426],region:'Western coast',kind:'Residential city',description:'A beautiful coastal hillside community with modern low-rise homes, private terraces, landscaped streets and Westhaven Bay views.',label:true},
 {id:'lakeside',name:'Lakeside',type:'city',icon:'≈',sub:'Lake district · Clean power',at:[621,425],region:'Central plateau',kind:'Lakeside community',description:'An inland district with parks, modern housing, research facilities and clean-energy infrastructure.',label:true},
 {id:'portmaren',name:'Port Maren',type:'city',icon:'▣',sub:'Petroleum terminals · Port',at:[1089,396],region:'Eastern coast',kind:'Oil-export and shipping port',description:'The main national oil-export port, with tank farms, petroleum loading systems, shipping cranes and industrial docks.',label:true},
 {id:'clearwater',name:'Clearwater',type:'city',icon:'◒',sub:'Beaches · Marine life',at:[327,652],region:'Southwest coast',kind:'Coastal tourism',description:'A laid-back coastal city known for beaches, fisheries and sheltered marinas.',label:true},
 {id:'sanridge',name:'Sanridge',type:'city',icon:'▤',sub:'Agriculture · Manufacturing',at:[566,676],region:'Southern interior',kind:'Production centre',description:'Sanridge combines agricultural processing, small factories and regional logistics corridors.',label:true},
 {id:'eastpoint',name:'Eastpoint',type:'city',icon:'⌁',sub:'Industry · Engineering',at:[1099,643],region:'Southeast',kind:'Industrial city',description:'Eastpoint specializes in refinery services, petroleum engineering, manufacturing and skilled technical work.',label:true},
 {id:'harborview',name:'Harborview',type:'city',icon:'⚓',sub:'Luxury villas · Marinas',at:[918,717],region:'Southeast coast',kind:'Luxury residential and tourism',description:'A beautiful luxury waterfront district of architecturally designed multistory villas, promenades, yacht facilities and coastal resorts.',label:true}
];
const EXTRA = [
 {id:'offshore',name:'Offshore Petroleum Field',type:'energy',icon:'◈',sub:'Deepwater production',at:[1495,420],region:'Eastern offshore waters',kind:'Oil extraction',description:'An offshore production platform illustrating Vermillion’s enormous fictional crude-oil export industry.',label:true},
 {id:'terminal',name:'Port Maren Oil Terminal',type:'energy',icon:'▣',sub:'Storage tanks · Export docks',at:[1112,457],region:'Port Maren',kind:'Crude-oil exports',description:'Storage tanks, pipework and tanker loading berths support Vermillion’s leading export industry.',label:true},
 {id:'refinery',name:'Eastpoint Refinery',type:'energy',icon:'▧',sub:'Fuel refining · Industrial plant',at:[1016,610],region:'Eastern industrial belt',kind:'Petroleum refinery',description:'A large refinery complex with process towers, storage tanks and energy infrastructure.',label:true},
 {id:'windfarm',name:'North Ridge Wind Farm',type:'energy',icon:'✳',sub:'Wind turbines · Clean electricity',at:[655,239],region:'Northern highlands',kind:'Wind energy',description:'A protected ridge with tall wind turbines supplying renewable power to Vermillion’s national electricity grid.',label:true},
 {id:'solar',name:'Lakeside Solar Park',type:'energy',icon:'☀',sub:'Solar fields · Photovoltaics',at:[548,555],region:'Central interior',kind:'Solar electricity',description:'An organized, fenced renewable-energy site with solar arrays and power conversion equipment.',label:true},
 {id:'battery',name:'Central Battery Storage',type:'energy',icon:'▤',sub:'Grid batteries',at:[690,536],region:'Central interior',kind:'Electricity storage',description:'Grid-scale batteries smooth fluctuations from renewable energy and strengthen grid reliability.',label:false},
 {id:'airport',name:'Vermillion International Airport',type:'landmark',icon:'✈',sub:'International runway · Terminal',at:[884,450],region:'Central-east',kind:'Airport',description:'The island’s principal international transport gateway with a runway, arrivals building and supporting terminals.',label:false},
 {id:'marina',name:'Harborview Marina',type:'landmark',icon:'⚓',sub:'Waterfront · Yachts',at:[890,680],region:'Southern bay',kind:'Marina',description:'A protected leisure harbor with yachts, piers and waterfront recreation.',label:false},
 {id:'estates',name:'Westridge Luxury Estates',type:'landmark',icon:'⌂',sub:'Multistory villas · Landscaped roads',at:[312,386],region:'Western coast',kind:'Luxury real estate',description:'An exclusive cluster of three-story villas with balconies, courtyards and green landscaped grounds.',label:false},
 {id:'beach',name:'Clearwater Beach',type:'landmark',icon:'◒',sub:'Protected coast · Sandy beaches',at:[329,701],region:'Southwest coast',kind:'Public beach',description:'An accessible palm-lined beach and waterfront promenade on the south-west coast.',label:false}
];
const LOCATIONS=[...CITY,...EXTRA].map(l=>({...l,x:PX(l.at[0]),z:PZ(l.at[1])}));
const byId=Object.fromEntries(LOCATIONS.map(l=>[l.id,l]));
const clickable=[];
const animatedRotors=[];
const placeStats={ordinaryBuildings:0,landmarkBuildings:0,trees:0,industrialSites:0,overlapsPrevented:0};
const viewport=document.getElementById('viewport');
const overlay=document.getElementById('worldOverlay');
const loading=document.getElementById('loading');
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();
const clock=new THREE.Clock();
let selected=null,currentFilter='all',query='',day=true,isOrbit=false,transition=null;

const scene=new THREE.Scene();
scene.background=new THREE.Color('#99cfdf');
scene.fog=new THREE.FogExp2('#a8d9e6',0.0008);
const camera=new THREE.PerspectiveCamera(46,1,0.1,1100);
camera.position.set(22,206,156);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewport.insertBefore(renderer.domElement,viewport.firstChild);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=0.065;
controls.minDistance=4;
controls.maxDistance=475;
controls.minPolarAngle=.12;
controls.maxPolarAngle=Math.PI/2-.035;
controls.screenSpacePanning=false;
controls.target.set(0,1,0);
controls.update();
const hemi=new THREE.HemisphereLight('#ffffff','#79947c',2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fffae7',3.0);
sun.position.set(-120,160,125);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-145;sun.shadow.camera.right=145;
sun.shadow.camera.top=130;sun.shadow.camera.bottom=-130;
sun.shadow.camera.near=1;sun.shadow.camera.far=390;
sun.shadow.bias=-.00009;sun.shadow.normalBias=.04;
scene.add(sun);
const ambient=new THREE.DirectionalLight('#a0ddef',.6);ambient.position.set(75,66,-60);scene.add(ambient);

const MAT={
 plaster:new THREE.MeshStandardMaterial({color:'#f2f0e8',roughness:.95}),
 ivory:new THREE.MeshStandardMaterial({color:'#dbd9d0',roughness:.96}),
 concrete:new THREE.MeshStandardMaterial({color:'#aebabc',roughness:.94}),
 sandstone:new THREE.MeshStandardMaterial({color:'#d5c5ab',roughness:.94}),
 timber:new THREE.MeshStandardMaterial({color:'#a77c58',roughness:.85}),
 roof:new THREE.MeshStandardMaterial({color:'#586b73',roughness:.9}),
 dark:new THREE.MeshStandardMaterial({color:'#2f4655',roughness:.83}),
 glass:new THREE.MeshStandardMaterial({color:'#6b9cb1',metalness:.19,roughness:.44,transparent:true,opacity:.92}),
 glassBlue:new THREE.MeshStandardMaterial({color:'#78acbd',metalness:.18,roughness:.39}),
 skyscraper:new THREE.MeshStandardMaterial({color:'#578aa2',metalness:.18,roughness:.42}),
 windows:new THREE.MeshStandardMaterial({color:'#2c5267',metalness:.16,roughness:.50}),
 road:new THREE.MeshStandardMaterial({color:'#667478',roughness:1,side:THREE.DoubleSide}),
 marking:new THREE.MeshStandardMaterial({color:'#e8dec5',roughness:1}),
 sidewalk:new THREE.MeshStandardMaterial({color:'#c6c5b7',roughness:1}),
 lawn:new THREE.MeshStandardMaterial({color:'#6eaa75',roughness:1}),
 bark:new THREE.MeshStandardMaterial({color:'#765c49',roughness:1}),
 foliage:new THREE.MeshStandardMaterial({color:'#3b7950',roughness:1}),
 foliage2:new THREE.MeshStandardMaterial({color:'#629a62',roughness:1}),
 solar:new THREE.MeshStandardMaterial({color:'#19476b',metalness:.29,roughness:.35,side:THREE.DoubleSide}),
 metallic:new THREE.MeshStandardMaterial({color:'#91a9ac',metalness:.45,roughness:.49}),
 yellow:new THREE.MeshStandardMaterial({color:'#d7a456',roughness:.8}),
 red:new THREE.MeshStandardMaterial({color:'#ba644f',roughness:.85}),
 white:new THREE.MeshStandardMaterial({color:'#edf5f4',roughness:.95}),
 water:new THREE.MeshStandardMaterial({color:'#42a3bd',metalness:.04,roughness:.56,side:THREE.DoubleSide}),
 oil:new THREE.MeshStandardMaterial({color:'#586775',roughness:.7}),
};
const boxGeo=new THREE.BoxGeometry(1,1,1);
const sphereGeo=new THREE.IcosahedronGeometry(1,0);
const cylinderGeo=new THREE.CylinderGeometry(1,1,1,10);
function object(geometry,material,parent=scene){const m=new THREE.Mesh(geometry,material);parent.add(m);return m;}
function box(x,y,z,w,h,d,material,parent=scene){const m=object(boxGeo,material,parent);m.position.set(x,y,z);m.scale.set(w,h,d);return m;}
function cylinder(x,y,z,top,bottom,height,material,parent=scene){const m=object(new THREE.CylinderGeometry(top,bottom,height,12),material,parent);m.position.set(x,y,z);return m;}
function ball(x,y,z,r,material,parent=scene){const m=object(sphereGeo,material,parent);m.position.set(x,y,z);m.scale.setScalar(r);return m;}
function linked(m,id){m.userData.locationId=id;clickable.push(m);return m;}
function fract(v){return v-Math.floor(v)}
function rand(n){return fract(Math.sin(n*127.17+16.423)*43758.5453)}
function between(a,b,t){return a+(b-a)*t}
function gauss(x,z,cx,cz,sx,sz){const dx=(x-cx)/sx,dz=(z-cz)/sz;return Math.exp(-.5*(dx*dx+dz*dz));}
function segDistance(x,z,ax,az,bx,bz){const vx=bx-ax,vz=bz-az;const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz||1)));return Math.hypot(x-(ax+t*vx),z-(az+t*vz));}
function onLand(x,z){let result=false;for(let i=0,j=COAST.length-1;i<COAST.length;j=i++){
 const a=COAST[i],b=COAST[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])result=!result;
}return result;}
function distCoast(x,z){let best=1e9;for(let i=0;i<COAST.length;i++){
 const a=COAST[i],b=COAST[(i+1)%COAST.length];best=Math.min(best,segDistance(x,z,...a,...b));
}return best;}
function height(x,z){
 const inland=Math.min(1,Math.max(0,distCoast(x,z)/7));
 const ridge=11.5*gauss(x,z,-14,-40,36,15)+6.8*gauss(x,z,42,-42,22,14);
 const cedar=7.5*gauss(x,z,60,40,26,15);
 const west=4.2*gauss(x,z,-86,-22,17,20);
 const undulation=.58*Math.sin(x*.22+z*.14)+.4*Math.cos(z*.26-x*.10);
 return Math.max(.36,.7+inland*(ridge+cedar+west+undulation));
}
// The coastline is a traced polygon from the supplied map; terrain is triangulated
// across that polygon, not a stretched island primitive.
const landGeo=new THREE.BufferGeometry();
const landPositions=[],landUvs=[];
for(const [x,z] of LAND_POINTS){
 landPositions.push(x,height(x,z),z);
 const px=x*5.65+725,py=z*5.65+510;
 landUvs.push(px/1448,1-py/1086);
}
landGeo.setAttribute('position',new THREE.Float32BufferAttribute(landPositions,3));
landGeo.setAttribute('uv',new THREE.Float32BufferAttribute(landUvs,2));
const upwards=[];
for(let i=0;i<LAND_TRIANGLES.length;i+=3){
 upwards.push(LAND_TRIANGLES[i],LAND_TRIANGLES[i+2],LAND_TRIANGLES[i+1]);
}
landGeo.setIndex(upwards);
landGeo.computeVertexNormals();
const texture=new THREE.TextureLoader().load('./assets/terrain.jpg',undefined,undefined,()=>{
 const warning=document.getElementById('assetWarning');if(warning)warning.hidden=false;
});
texture.colorSpace=THREE.SRGBColorSpace;
texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const ground=object(landGeo,new THREE.MeshStandardMaterial({map:texture,color:'#f4fff3',roughness:1,side:THREE.DoubleSide}));
ground.receiveShadow=true;
// Coast elevation skirt prevents visible seams at glancing camera angles.
const strip=[];
for(let i=0;i<COAST.length;i++){
 const a=COAST[i],b=COAST[(i+1)%COAST.length];
 strip.push(a[0],height(...a),a[1],b[0],height(...b),b[1],a[0],-1.2,a[1]);
 strip.push(b[0],height(...b),b[1],b[0],-1.2,b[1],a[0],-1.2,a[1]);
}
const stripGeo=new THREE.BufferGeometry();stripGeo.setAttribute('position',new THREE.Float32BufferAttribute(strip,3));stripGeo.computeVertexNormals();
object(stripGeo,new THREE.MeshStandardMaterial({color:'#c5bc9c',roughness:1,side:THREE.DoubleSide}));
const shorePts=COAST.map(([x,z])=>new THREE.Vector3(x,height(x,z)+.035,z));
scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shorePts),new THREE.LineBasicMaterial({color:'#e8e5c7',transparent:true,opacity:.9})));
const seaCanvas=document.createElement('canvas');seaCanvas.width=256;seaCanvas.height=256;
const sctx=seaCanvas.getContext('2d');sctx.fillStyle='#acdce7';sctx.fillRect(0,0,256,256);
for(let i=0;i<220;i++){
 const x=rand(i*1.3)*256,y=rand(i*7.1+2)*256;
 sctx.strokeStyle=`rgba(246,255,255,${.04+rand(i*8.1)*.1})`;
 sctx.lineWidth=.3+rand(i*3.14);sctx.beginPath();sctx.moveTo(x,y);sctx.lineTo(x+6+rand(i*12)*26,y);sctx.stroke();
}
const seaTex=new THREE.CanvasTexture(seaCanvas);seaTex.wrapS=seaTex.wrapT=THREE.RepeatWrapping;seaTex.repeat.set(22,22);
const sea=object(new THREE.PlaneGeometry(1100,1100),new THREE.MeshStandardMaterial({color:'#69bcd2',map:seaTex,roughness:.63,metalness:.02,side:THREE.DoubleSide}));sea.rotation.x=-Math.PI/2;sea.position.y=-1.25;

// --- SPATIAL PLANNING ------------------------------------------------------
// One reservation system for structures, trees, industrial platforms and lots.
// No random instance is allowed to intersect an already-reserved footprint.
const occupied=[];
const roadZones=[];
function reserve(x,z,r,type='structure'){occupied.push({x,z,r,type});return true;}
function blocked(x,z,r,{roads=true,coast=true}={}){
 if(!onLand(x,z)||(coast&&distCoast(x,z)<r*.58+.6))return true;
 for(const p of occupied){if(Math.hypot(p.x-x,p.z-z)<p.r+r+.35)return true;}
 if(roads){for(const seg of roadZones){
  if(segDistance(x,z,seg[0],seg[1],seg[2],seg[3])<r+seg[4]+.38)return true;
 }}
 return false;
}
function tryReserve(x,z,r,type,options){
 if(blocked(x,z,r,options)){placeStats.overlapsPrevented++;return false;}
 return reserve(x,z,r,type);
}
function site(id,r){const l=byId[id];reserve(l.x,l.z,r,'reserved:'+id);return l;}
// Industrial zones, landmark zones and runway reserved BEFORE roads/buildings/trees.
site('solar',12);site('battery',6.3);site('refinery',14);site('terminal',14.5);
site('airport',18);site('estates',12);site('marina',9.5);
// Highways follow corridors from the supplied map instead of radial spokes.
const ROUTES=[
 {name:'A1',pts:[[452,151],[473,258],[520,360],[610,421],[678,508],[742,625]],width:2.8},
 {name:'A2',pts:[[241,422],[351,465],[426,524],[457,637],[511,779],[566,681],[742,625]],width:2.45},
 {name:'A3',pts:[[1100,394],[1033,467],[935,509],[871,565],[742,625]],width:2.5},
 {name:'A4',pts:[[742,625],[890,589],[1060,591],[1210,612]],width:2.8},
 {name:'Coastal West',pts:[[241,422],[315,530],[327,652],[511,779],[566,681]],width:1.7},
 {name:'Highland Express',pts:[[452,151],[599,223],[681,295],[805,336],[1089,396]],width:1.8},
 {name:'South Link',pts:[[566,681],[742,625],[918,717],[1099,643]],width:1.8},
 {name:'Central Connector',pts:[[621,425],[681,295],[917,472]],width:1.5}
];
function makeRoad(landmarks,width=2.0,name='Road'){
 const curve=new THREE.CatmullRomCurve3(landmarks.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
 const n=Math.max(48,landmarks.length*27),v=[],ind=[];
 let last=null,previousOnLand=false;
 for(let i=0;i<=n;i++){
  const p=curve.getPoint(i/n),t=curve.getTangent(i/n);
  const m=Math.hypot(t.x,t.z)||1,nx=-t.z/m,nz=t.x/m;
  const a=[p.x+nx*width/2,p.z+nz*width/2];
  const b=[p.x-nx*width/2,p.z-nz*width/2];
  v.push(a[0],height(...a)+.14,a[1],b[0],height(...b)+.14,b[1]);
  const currentOnLand=onLand(p.x,p.z)&&!occupied.some(r=>r.type.startsWith('reserved:')&&Math.hypot(p.x-r.x,p.z-r.z)<r.r+width/2+.05);
  if(i>0&&previousOnLand&&currentOnLand){const k=(i-1)*2;ind.push(k,k+1,k+2,k+1,k+3,k+2);}
  if(last&&previousOnLand&&currentOnLand)roadZones.push([last.x,last.z,p.x,p.z,width/2]);
  last={x:p.x,z:p.z};previousOnLand=currentOnLand;
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ind);g.computeVertexNormals();
 const road=object(g,MAT.road);road.receiveShadow=true;
 if(width>2.2){
  for(let i=4;i<n;i+=11){
   const p=curve.getPoint(i/n),t=curve.getTangent(i/n);
   if(!onLand(p.x,p.z))continue;
   const m=box(p.x,height(p.x,p.z)+.18,p.z,.15,.025,1.3,MAT.marking);
   m.rotation.y=Math.atan2(t.x,t.z);
  }
 }
}
for(const r of ROUTES)makeRoad(r.pts.map(([x,y])=>point(x,y)),r.width,r.name);

// Static occupied regions have their own level plinths; equipment never clips terrain.
function makePlatform(x,z,w,d,{mat=MAT.concrete,id=null}={}){
 let max=-1e9,min=1e9;
 for(let i=0;i<=5;i++)for(let j=0;j<=5;j++){
  const sx=x+(i/5-.5)*w,sz=z+(j/5-.5)*d;
  const y=onLand(sx,sz)?height(sx,sz):-1.15;
  max=Math.max(max,y);min=Math.min(min,y);
 }
 const top=max+.22,bottom=min-.9;
 const foundation=box(x,(top+bottom)/2,z,w,top-bottom,d,mat);
 foundation.receiveShadow=true;
 if(id)linked(foundation,id);
 return top;
}
// Instancing reduces draw calls for hundreds of buildings; picking maps back to city.
const instances=new Map();
function record(material,x,y,z,w,h,d,id,ry=0){
 let group=instances.get(material);
 if(!group){group=[];instances.set(material,group);}
 group.push({x,y,z,w,h,d,id,ry});
}
function flushInstances(){
 for(const [material,items] of instances){
  const im=new THREE.InstancedMesh(boxGeo,material,items.length);
  im.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const o=new THREE.Object3D(),ids=[];
  items.forEach((b,i)=>{
   o.position.set(b.x,b.y,b.z);o.scale.set(b.w,b.h,b.d);o.rotation.set(0,b.ry,0);o.updateMatrix();
   im.setMatrixAt(i,o.matrix);ids.push(b.id);
  });
  im.instanceMatrix.needsUpdate=true;
  im.userData.instanceLocationIds=ids;
  im.castShadow=false;im.receiveShadow=true;
  scene.add(im);clickable.push(im);
 }
}
// City architecture scales by region. Tight footprints and spacing are checked.
function addBuilding(x,z,id,seed,style='urban'){
 const size=style==='capital'?1.3+rand(seed*2.1)*1.15:1.45+rand(seed*3.7)*1.05;
 const depth=size*(.72+rand(seed*4.1)*.36);
 const radius=.5*Math.hypot(size,depth)+.19;
 if(!tryReserve(x,z,radius,'building:'+id))return false;
 const floors=style==='capital'?3+Math.floor(rand(seed*1.13)*5):style==='industry'?2+Math.floor(rand(seed*1.13)*3):2+Math.floor(rand(seed*1.13)*3);
 const h=floors*(style==='capital'?1.6:1.38);
 const y=height(x,z);
 const m=rand(seed*1.76)>.75?MAT.ivory:rand(seed*2.8)>.43?MAT.plaster:MAT.sandstone;
 record(m,x,y+h/2+.15,z,size,h,depth,id);
 record(MAT.roof,x,y+h+.19,z,size+.2,.22,depth+.19,id);
 record(MAT.windows,x,y+h*.52,z+depth/2+.027,size*.72,Math.max(.4,h*.25),.05,id);
 if(floors>3)record(MAT.glass,x,y+h*.78,z+depth/2+.03,size*.7,.32,.05,id);
 placeStats.ordinaryBuildings++;
 return true;
}
function populateCity(city,seed){
 const capital=city.id==='vermillion';
 const style=capital?'capital':city.id==='portmaren'||city.id==='eastpoint'?'industry':'urban';
 const limit=capital?220:city.id==='harborview'||city.id==='westridge'?45:65;
 const range=capital?22:city.id==='harborview'?16:12;
 let done=0;
 // City layouts are organized blocks, with reserved corridors and individual setbacks.
 for(let row=-8;row<=8 && done<limit;row++){
  for(let col=-8;col<=8 && done<limit;col++){
   const s=seed+row*42+col*6.13;
   const x=city.x+col*3.25+(rand(s)*.72-.36);
   const z=city.z+row*3.1+(rand(s+4)*.72-.36);
   if(Math.hypot((x-city.x)/range,(z-city.z)/range)>1.25)continue;
   if(rand(s+23)<.15)continue;
   if(addBuilding(x,z,city.id,s,style))done++;
  }
 }
}
for(let i=0;i<CITY.length;i++)populateCity(CITY[i],i*724+30);
flushInstances();

// Individual high-quality landmarks with distinguishable roofs and facade details.
function tallBuilding(x,z,w,d,h,id,material=MAT.skyscraper){
 if(!tryReserve(x,z,.5*Math.hypot(w,d)+1,'tower:'+id))return false;
 const y=height(x,z);
 const body=linked(box(x,y+h/2,z,w,h,d,material),id);body.castShadow=true;
 box(x,y+h+.13,z,w+.17,.26,d+.17,MAT.dark);
 for(let level=1;level<Math.floor(h/1.85);level++){
  const yy=y+level*1.85;
  box(x,yy,z+d/2+.05,w*.8,.16,.095,MAT.glassBlue);
  box(x+w/2+.05,yy,z,.095,.16,d*.75,MAT.glass);
 }
 box(x,y+h+.8,z,.19,1.4,.19,MAT.metallic);
 placeStats.landmarkBuildings++;
 return true;
}
// Anchor the skyline between the shore and capital urban grid; free lots only.
for(let i=0;i<34;i++){
 const t=i+18;
 const x=byId.vermillion.x+(rand(t*22)*2-1)*17;
 const z=byId.vermillion.z+(rand(t*37)*2-1)*14;
 const h=12+rand(t*28)*25;
 tallBuilding(x,z,2.3+rand(t*8)*1.6,2.1+rand(t*5)*1.3,h,'vermillion',i%3?MAT.skyscraper:MAT.glassBlue);
}
for(let i=0;i<8;i++){
 const x=byId.portmaren.x+(rand(i*74+5)*2-1)*10;
 const z=byId.portmaren.z+(rand(i*39+7)*2-1)*10;
 tallBuilding(x,z,2.2,2.3,9+rand(i+11)*13,'portmaren',MAT.concrete);
}
function villa(x,z,id,seed,w=4.2,d=3.6){
 const r=.5*Math.hypot(w+2,d+2);
 if(!tryReserve(x,z,r,'villa:'+id))return false;
 const y=height(x,z),h=4.7+rand(seed+7)*1.1;
 // Foundation follows local grade, main house sits above it.
 const base=linked(box(x,y+.22,z,w+1.3,.44,d+1.6,MAT.sandstone),id);
 base.receiveShadow=true;
 const shell=linked(box(x,y+h/2+.45,z,w,h,d,MAT.plaster),id);shell.castShadow=true;
 box(x,y+h+.55,z,w+.7,.28,d+.7,MAT.dark);
 // Warm timber accent and strong horizontal balconies; clear glass not glossy.
 box(x-w*.33,y+h*.56+.4,z+d/2+.12,w*.2,h*.75,.14,MAT.timber);
 box(x,y+h*.55+.35,z+d*.58,w*.82,.17,d*.64,MAT.ivory);
 box(x,y+h*.62+.39,z+d*.89,w*.82,.42,.09,MAT.glass);
 box(x,y+h*.32,z+d/2+.05,w*.72,h*.35,.09,MAT.glassBlue);
 box(x,y+h*.8,z+d/2+.05,w*.66,.55,.1,MAT.windows);
 box(x,y+.05,z+d*.9,w*1.2,.1,1.05,MAT.sidewalk);
 // Tiny non-intersecting terrace planter.
 box(x+w*.33,y+h*.64+.4,z+d*.71,.8,.28,.7,MAT.lawn);
 placeStats.landmarkBuildings++;
 return true;
}
// Explicitly zoned luxury neighborhoods. Their primary footprint is pre-reserved,
// so regular city buildings, turbines, and trees cannot encroach.
function villaCluster(id,at,n,columns){
 const l=byId[id],spacing=5.0;
 for(let i=0;i<n;i++){
  const col=i%columns,row=Math.floor(i/columns),x=l.x+(col-(columns-1)/2)*spacing;
  const z=l.z+(row-Math.floor((n-1)/columns)/2)*5.1;
  // Allow architecture inside its reserved master-plan zone, without
  // adding conflicting reservations from adjacent estate properties.
  const w=3.6,d=3.2,y=height(x,z);
  if(!onLand(x,z)||distCoast(x,z)<2.2)continue;
  if(roadZones.some(s=>segDistance(x,z,s[0],s[1],s[2],s[3])<3.3+s[4]))continue;
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const b=linked(box(0,2.6,0,w,4.8,d,MAT.plaster,g),at);b.castShadow=true;
  box(0,5.08,0,w+.45,.22,d+.45,MAT.dark,g);
  box(0,3.0,d/2+.08,w*.81,1.2,.12,MAT.glassBlue,g);
  box(0,4.58,d/2+.08,w*.71,.51,.10,MAT.windows,g);
  box(0,3.4,d*.72,w*.85,.15,d*.51,MAT.ivory,g);
  box(0,3.64,d*.98,w*.82,.35,.08,MAT.glass,g);
  box(-w*.31,3.15,d/2+.1,.31,3.5,.12,MAT.timber,g);
  box(0,.08,d*1.02,w+1.0,.16,.85,MAT.sidewalk,g);
  placeStats.landmarkBuildings++;
 }
}
villaCluster('estates','estates',12,4);
// Harborview gets its own luxury neighborhood outside the marina reservation.
for(let i=0;i<38;i++){
 const seed=1000+i*17;
 const x=byId.harborview.x+(rand(seed)*2-1)*15;
 const z=byId.harborview.z+(rand(seed+2)*2-1)*13;
 villa(x,z,'harborview',seed,3.3+rand(seed+5),3.0+rand(seed+7));
}
for(let i=0;i<20;i++){
 const seed=1500+i*21;
 const x=byId.westridge.x+(rand(seed)*2-1)*14;
 const z=byId.westridge.z+(rand(seed+2)*2-1)*13;
 villa(x,z,'westridge',seed,3.5,3.1);
}

// --- ENERGY LANDMARKS AND NATIONAL INFRASTRUCTURE -------------------------
function platform(id,w,d,color=MAT.concrete){
 const l=byId[id],top=makePlatform(l.x,l.z,w,d,{mat:color,id});
 placeStats.industrialSites++;
 const g=new THREE.Group();g.position.set(l.x,top,l.z);scene.add(g);
 return g;
}
function solarFarm(){
 const g=platform('solar',18,13,MAT.lawn);
 // Evenly spaced, physically separate rows. All equipment stays within pad.
 for(let row=0;row<6;row++)for(let col=0;col<9;col++){
  const x=-7.3+col*1.82,z=-4.8+row*1.75;
  const frame=box(x,.82,z,1.47,.10,.93,MAT.solar,g);frame.rotation.x=-.28;
  box(x,.4,z,.075,.8,.08,MAT.metallic,g);
  if(row===0&&col===0)linked(frame,'solar');
 }
 for(let i=0;i<3;i++){
  linked(box(8,1.4,-4.0+i*3,1.65,2.45,2.0,MAT.ivory,g),'solar');
  box(8,2.8,-4.0+i*3,1.8,.11,2.1,MAT.dark,g);
 }
 // Fence rails and entrance with no panels beyond the platform.
 for(const z of [-6.25,6.25])box(0,.85,z,18,.065,.07,MAT.metallic,g);
 for(const x of [-8.85,8.85])box(x,.85,0,.07,.065,12.5,MAT.metallic,g);
}
solarFarm();
function batteries(){
 const g=platform('battery',9,6,MAT.sidewalk);
 for(let i=0;i<5;i++){
  const x=-3.4+i*1.65;
  const r=linked(box(x,1.05,0,1.26,2.05,2.4,MAT.white,g),'battery');
  box(x,1.4,1.23,1.02,.85,.03,MAT.dark,g);
  box(x,2.15,0,1.25,.11,2.45,MAT.roof,g);
 }
}
batteries();
function windFarm(){
 const l=byId.windfarm;
 // Separate turbines distributed on a ridge, each with an unobstructed site.
 for(let i=0;i<9;i++){
  const angle=i*2.399;
  const r=4.6+Math.sqrt(i)*4.8;
  const x=l.x+Math.cos(angle)*r,z=l.z+Math.sin(angle)*r*.65;
  if(!tryReserve(x,z,2.6,'wind-turbine',{roads:false}))continue;
  const y=height(x,z);
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const pole=linked(cylinder(0,6.2,0,.19,.34,12.4,MAT.white,g),'windfarm');pole.castShadow=true;
  const nacelle=linked(box(0,12.6,0,.9,.5,1.8,MAT.white,g),'windfarm');
  const rotor=new THREE.Group();rotor.position.set(0,12.6,.98);g.add(rotor);
  ball(0,0,0,.38,MAT.metallic,rotor);
  for(let j=0;j<3;j++){
   const blade=box(0,2.32,0,.35,4.5,.08,MAT.white,rotor);
   blade.rotation.z=j*2*Math.PI/3;
   blade.position.x=-Math.sin(j*2*Math.PI/3)*2.0;
   blade.position.y=Math.cos(j*2*Math.PI/3)*2.0;
  }
  animatedRotors.push(rotor);
 }
}
windFarm();
function tank(x,z,baseY,r,id,parent=scene){
 const body=linked(cylinder(x,baseY+1.25,z,r,r,2.5,MAT.metallic,parent),id);
 const roof=cylinder(x,baseY+2.52,z,r+.13,r+.13,.12,MAT.white,parent);
 // Visible top band, muted realistic metal.
 cylinder(x,baseY+2.58,z,r*.77,r*.77,.09,MAT.dark,parent);
 return body;
}
function terminal(){
 const g=platform('terminal',22,17,MAT.sidewalk);
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  tank(-8+col*4.9,-4.7+row*4.7,0,1.75,'terminal',g);
 }
 for(let i=0;i<3;i++){
  const x=6.3+i*2.2;
  const pipe=box(x,.56,5.8,.22,.25,12,MAT.yellow,g);
  linked(pipe,'terminal');
 }
 // Loading gantries distinguish the site from residential parts of the island.
 for(let i=0;i<3;i++){
  const x=-7+i*7;
  box(x,3.75,7.4,.38,7.5,.38,MAT.metallic,g);
  box(x+1.5,7.45,7.4,3.2,.28,.4,MAT.yellow,g);
 }
}
terminal();
function refinery(){
 const g=platform('refinery',19,16,MAT.sandstone);
 for(let i=0;i<6;i++){
  const x=-6+(i%3)*5.5,z=-3+Math.floor(i/3)*7;
  const h=4.5+rand(i*4.1)*9;
  const tower=linked(cylinder(x,h/2,z,.6,.87,h,MAT.metallic,g),'refinery');
  box(x,h+.15,z,1.2,.28,1.2,MAT.dark,g);
  for(let j=1;j<4;j++){
   const yy=h*j/4;
   box(x,yy,z+1,.17,.14,2.1,MAT.yellow,g);
  }
 }
 for(let i=0;i<5;i++)tank(-7+i*3.4,6.1,0,.96,'refinery',g);
 for(let i=0;i<4;i++){
  const z=-6+i*2.9;
  linked(box(0,.72,z,14,.24,.24,MAT.yellow,g),'refinery');
 }
}
refinery();
function harbor(){
 const g=platform('marina',13,8,MAT.sidewalk);
 for(let i=0;i<5;i++){
  const z=-2.9+i*1.4;
  linked(box(2,.35,z,7,.22,.27,MAT.timber,g),'marina');
  box(2.7,.53,z+.38,1.6,.38,.5,MAT.white,g);
  box(2.7,.86,z+.22,.85,.23,.48,MAT.glass,g);
 }
 linked(box(-4,1.65,0,2.6,3.1,3.8,MAT.plaster,g),'marina');
 box(-4,3.31,0,3,.19,4,MAT.dark,g);
}
harbor();
function airport(){
 const l=byId.airport,top=makePlatform(l.x,l.z,31,17,{mat:MAT.sidewalk,id:'airport'});
 placeStats.industrialSites++;
 const g=new THREE.Group();g.position.set(l.x,top,l.z);scene.add(g);
 linked(box(0,.11,0,29,.21,4.4,MAT.road,g),'airport');
 for(let i=-13;i<=13;i+=3)box(i,.23,0,.93,.03,.09,MAT.marking,g);
 linked(box(0,1.9,5.1,13,3.5,3.9,MAT.plaster,g),'airport');
 box(0,3.7,5.1,13.4,.28,4.2,MAT.dark,g);
 box(0,1.95,7.09,11,1.5,.08,MAT.glass,g);
 for(let i=-4;i<=4;i+=2.2)box(i,1.96,7.13,.12,2.5,.13,MAT.metallic,g);
}
airport();
function offshoreRig(){
 const l=byId.offshore,g=new THREE.Group();g.position.set(l.x,-1.05,l.z);scene.add(g);
 for(const x of [-5.2,5.2])for(const z of [-4.2,4.2]){
  cylinder(x,4.7,z,.30,.54,11,MAT.dark,g);
 }
 linked(box(0,10.3,0,12,1.6,11,MAT.yellow,g),'offshore');
 linked(box(0,12.15,-1.8,7,2.2,6,MAT.white,g),'offshore');
 for(let j=0;j<8;j++){
  const w=2.8*(1-j/10);
  box(0,15+j*1.6,2.5,w,.15,.18,MAT.red,g);
  if(j<7)for(const x of [-w/2,w/2])box(x,15.8+j*1.6,2.5,.14,1.7,.14,MAT.dark,g);
 }
 cylinder(4.5,13.4,-3,.2,.24,6,MAT.metallic,g);
}
offshoreRig();
function vessel(x,z,id,rot=0){
 const g=new THREE.Group();g.position.set(x,-.77,z);g.rotation.y=rot;scene.add(g);
 linked(box(0,.10,0,4,1.35,14,MAT.oil,g),id);
 box(0,1.14,4.8,3,2.3,3,MAT.plaster,g);
 for(let i=0;i<5;i++)cylinder(0,1.12,-5+i*2.1,1.1,1.1,.6,MAT.yellow,g);
}
vessel(141,-8,'terminal',-.11);
vessel(144,24,'offshore',.4);
// Contemporary bayfront public promenade, with no overlapping urban vegetation.
function promenade(){
 const l=byId.beach;
 for(let i=0;i<10;i++){
  const x=l.x-7+i*1.5,z=l.z-2.5;
  if(!onLand(x,z)||blocked(x,z,.34,{roads:false}))continue;
  box(x,height(x,z)+.11,z,1.1,.2,2.2,MAT.sidewalk);
 }
}
promenade();

// --- FOREST AND STREET LANDSCAPING -----------------------------------------
// Trees are placed LAST. A tree is rejected if its canopy would intersect any
// building, rooftop, oil facility, solar array, runway, highway or another tree.
const trunks=[],canopies=[];
for(let i=0;i<10500 && placeStats.trees<1080;i++){
 const x=-113+rand(i*8.17+34)*230,z=-80+rand(i*9.19+53)*158;
 const northern=z<-18,western=x<-43,eastern=x>42;
 const forestBias=northern||western||eastern?.83:.28;
 if(rand(i*1.17+12)>forestBias)continue;
 const size=.62+rand(i*2.4+15)*.62;
 const radius=size*1.55;
 if(!tryReserve(x,z,radius,'tree'))continue;
 const y=height(x,z),h=1.0+rand(i*1.83)*.7;
 trunks.push([x,y+h/2,z,.18,h,.18]);
 canopies.push([x,y+h+size*.53,z,size*1.28,size*.95,size*1.24,rand(i*3)>0.5]);
 placeStats.trees++;
}
function instanceForest(material,items){
 if(items.length===0)return;
 const geometry=material===MAT.bark?cylinderGeo:sphereGeo;
 const inst=new THREE.InstancedMesh(geometry,material,items.length);
 const t=new THREE.Object3D();
 items.forEach((a,i)=>{
  t.position.set(a[0],a[1],a[2]);t.scale.set(a[3],a[4],a[5]);t.rotation.set(0,rand(i*17.1)*6,0);t.updateMatrix();inst.setMatrixAt(i,t.matrix);
 });
 inst.instanceMatrix.needsUpdate=true;inst.receiveShadow=true;
 scene.add(inst);
}
instanceForest(MAT.bark,trunks);
instanceForest(MAT.foliage,canopies.filter(a=>a[6]));
instanceForest(MAT.foliage2,canopies.filter(a=>!a[6]));
// Ocean and trees are environmental, not fake landmarks to click.

// Basic placement audit: reserved industrial platforms do not overlap each other.
const sites=occupied.filter(r=>r.type.startsWith('reserved:'));
const siteConflicts=[];
for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++){
 const a=sites[i],b=sites[j];
 if(Math.hypot(a.x-b.x,a.z-b.z)+.01<a.r+b.r)
  siteConflicts.push([a.type,b.type]);
}
window.VermillionDebug={placeStats,siteConflicts,coastlineVertices:COAST.length,terrainTriangles:LAND_TRIANGLES.length/3};
if(siteConflicts.length)console.warn('Vermillion planned-site clearance issue:',siteConflicts);

// --- DESTINATIONS, CAMERA, INTERACTION ------------------------------------
const dest=document.getElementById('destinations');
const search=document.getElementById('search');
const sidebar=document.getElementById('sidebar');
const detail=document.getElementById('detailCard');
function matches(l){
 return (currentFilter==='all'||l.type===currentFilter||currentFilter==='energy'&&l.type==='energy')&&
 (`${l.name} ${l.sub} ${l.description} ${l.kind}`.toLowerCase().includes(query));
}
function renderList(){
 const shown=LOCATIONS.filter(matches);
 document.getElementById('resultCount').textContent=shown.length+' LOCATIONS';
 dest.innerHTML=shown.length?shown.map(l=>`<button type="button" class="dest ${selected===l.id?'active':''}" data-id="${l.id}">
 <span class="dest-icon ${l.type}">${l.icon}</span><span class="dest-copy"><strong>${l.name}</strong><small>${l.sub}</small></span><span class="dest-arrow">↗</span>
 </button>`).join(''):'<p class="empty">No matching destinations. Try another search or category.</p>';
}
function details(l){
 document.getElementById('detailName').textContent=l.name;
 document.getElementById('detailSubtitle').textContent=l.sub;
 document.getElementById('detailCategory').textContent=l.type==='city'?'CITY / DISTRICT':l.type==='energy'?'ENERGY INFRASTRUCTURE':'LANDMARK';
 document.getElementById('detailDescription').textContent=l.description;
 document.getElementById('detailType').textContent=l.kind;
 document.getElementById('detailRegion').textContent=l.region;
 detail.hidden=false;
}
function flyTo(pos,target,duration=1.25){
 transition={fromP:camera.position.clone(),fromT:controls.target.clone(),toP:pos.clone(),toT:target.clone(),duration,elapsed:0};
 controls.autoRotate=false;isOrbit=false;
 document.getElementById('orbitBtn').classList.remove('active');
 document.getElementById('orbitBtn').setAttribute('aria-pressed','false');
}
function selectLocation(id,street=false){
 const l=byId[id];if(!l)return;
 selected=id;renderList();details(l);
 const y=l.id==='offshore'?9:height(l.x,l.z);
 const target=new THREE.Vector3(l.x,y+(street?2.2:4.2),l.z);
 const offset=street?new THREE.Vector3(9,4.2,12):new THREE.Vector3(21,29,32);
 if(l.id==='offshore')offset.set(21,22,36);
 if(l.id==='vermillion'&&!street)offset.set(29,43,52);
 flyTo(target.clone().add(offset),target);
 if(window.innerWidth<960)sidebar.classList.add('collapsed');
}
function home(){
 selected=null;renderList();detail.hidden=true;
 flyTo(new THREE.Vector3(0,172,134),new THREE.Vector3(0,2,0),1.45);
 sidebar.classList.add('collapsed');
}
// List and search work even while embedded as a standalone site in an iframe.
dest.addEventListener('click',e=>{
 const b=e.target.closest('[data-id]');if(b)selectLocation(b.dataset.id);
});
search.addEventListener('input',()=>{query=search.value.toLowerCase().trim();renderList();});
search.addEventListener('keydown',e=>{
 if(e.key==='Enter'){
  const first=LOCATIONS.find(matches);if(first)selectLocation(first.id);
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='/'&&document.activeElement!==search){e.preventDefault();sidebar.classList.remove('collapsed');search.focus();}
 if(e.key==='Escape'){detail.hidden=true;search.blur();}
});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
 currentFilter=btn.dataset.filter;
 document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));
 renderList();
}));
document.getElementById('togglePanel').addEventListener('click',()=>sidebar.classList.toggle('collapsed'));
document.getElementById('detailClose').addEventListener('click',()=>detail.hidden=true);
document.getElementById('exploreHere').addEventListener('click',()=>{if(selected)selectLocation(selected,true);});
document.getElementById('homeBtn').addEventListener('click',home);
document.getElementById('streetBtn').addEventListener('click',()=>selectLocation(selected||'harborview',true));
document.getElementById('zoomIn').addEventListener('click',()=>camera.position.lerp(controls.target,.20));
document.getElementById('zoomOut').addEventListener('click',()=>camera.position.addScaledVector(camera.position.clone().sub(controls.target),.27));
document.getElementById('orbitBtn').addEventListener('click',e=>{
 isOrbit=!isOrbit;controls.autoRotate=isOrbit;controls.autoRotateSpeed=.38;
 e.currentTarget.classList.toggle('active',isOrbit);e.currentTarget.setAttribute('aria-pressed',String(isOrbit));
});
const sceneLights=[];
for(const l of CITY){
 const light=new THREE.PointLight('#ffc48d',0,19,2);light.position.set(l.x,height(l.x,l.z)+8,l.z);scene.add(light);sceneLights.push(light);
}
document.getElementById('timeBtn').addEventListener('click',()=>{
 day=!day;
 scene.background.set(day?'#99cfdf':'#304a61');scene.fog.color.set(day?'#a8d9e6':'#597080');
 sun.intensity=day?3.0:.6;hemi.intensity=day?2.1:.8;ambient.intensity=day?.6:.32;
 renderer.toneMappingExposure=day?1.25:.87;
 sceneLights.forEach(l=>l.intensity=day?0:17);
 document.getElementById('timeIcon').textContent=day?'☾':'☼';
 document.getElementById('timeLabel').textContent=day?'Evening':'Daylight';
});
const labelNodes=new Map();
for(const l of LOCATIONS.filter(l=>l.label)){
 const b=document.createElement('button');b.type='button';b.className='world-label '+l.type;
 b.textContent=l.name;b.title='Explore '+l.name;
 b.addEventListener('click',()=>selectLocation(l.id));overlay.appendChild(b);labelNodes.set(l.id,b);
}
const tempV=new THREE.Vector3();
function updateLabels(){
 const rect=renderer.domElement.getBoundingClientRect(),shown=[];
 for(const l of LOCATIONS.filter(l=>l.label)){
  const el=labelNodes.get(l.id);
  const world=tempV.set(l.x,(l.id==='offshore'?22:height(l.x,l.z)+5),l.z).clone();
  const p=world.project(camera);
  if(p.z>=1||p.z<=-1){el.hidden=true;continue;}
  const sx=(p.x*.5+.5)*rect.width,sy=(-p.y*.5+.5)*rect.height;
  if(sx<30||sx>rect.width-30||sy<83||sy>rect.height-85){el.hidden=true;continue;}
  if((currentFilter!=='all'||query)&&!matches(l)&&selected!==l.id){el.hidden=true;continue;}
  shown.push({l,el,sx,sy,d:world.distanceTo(camera.position)});
 }
 shown.sort((a,b)=>a.l.id===selected?-1:b.l.id===selected?1:a.d-b.d);
 const used=[],max=window.innerWidth<600?5:window.innerWidth<1000?9:15;
 for(const it of shown){
  const overlap=used.some(u=>Math.abs(it.sx-u.sx)<100&&Math.abs(it.sy-u.sy)<32);
  if(overlap||used.length>=max){it.el.hidden=true;continue;}
  it.el.hidden=false;it.el.style.left=it.sx+'px';it.el.style.top=it.sy+'px';
  it.el.classList.toggle('active',it.l.id===selected);used.push(it);
 }
}
let pressed=null;
renderer.domElement.addEventListener('pointerdown',e=>{pressed={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!pressed)return;
 const moved=Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y);pressed=null;
 if(moved>6)return;
 const r=renderer.domElement.getBoundingClientRect();
 mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 raycaster.setFromCamera(mouse,camera);
 const hits=raycaster.intersectObjects(clickable,false);
 for(const h of hits){
  const ids=h.object.userData.instanceLocationIds;
  const id=ids?ids[h.instanceId]:h.object.userData.locationId;
  if(id){selectLocation(id);return;}
 }
});
sidebar.classList.add('collapsed');
renderList();
function resize(){
 const w=viewport.clientWidth,h=viewport.clientHeight;if(w<1||h<1)return;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);resize();
let firstFrame=false;
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.065);
 seaTex.offset.x+=dt*.0014;
 seaTex.offset.y-=dt*.0009;
 animatedRotors.forEach((r,i)=>r.rotation.z+=dt*(.42+.04*(i%3)));
 if(transition){
  transition.elapsed+=dt;
  const t=Math.min(1,transition.elapsed/transition.duration),s=t*t*(3-2*t);
  camera.position.lerpVectors(transition.fromP,transition.toP,s);
  controls.target.lerpVectors(transition.fromT,transition.toT,s);
  if(t>=1)transition=null;
 }
 controls.update();renderer.render(scene,camera);
 if(!firstFrame){
  firstFrame=true;window.vermillion3DReady=true;
  loading.classList.add('hidden');setTimeout(()=>loading.remove(),950);
 }
 updateLabels();
}
animate();
