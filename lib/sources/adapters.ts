import {SourceAdapter} from './registry';

export const unavailableAdapters:SourceAdapter[]=[
 {id:'public-search',name:'Public search',type:'search',available:false,async collect(){return[];}},
 {id:'marketplace',name:'Marketplace provider',type:'marketplace',available:false,async collect(){return[];}},
 {id:'social-signals',name:'Social signals',type:'social',available:false,async collect(){return[];}},
 {id:'reviews',name:'Review provider',type:'reviews',available:false,async collect(){return[];}},
 {id:'pricing',name:'Pricing provider',type:'pricing',available:false,async collect(){return[];}},
];
