export type Block={id:string;type:string;order:number;data:Record<string,any>};
export const blockLabels:Record<string,string>={hero:"Hero",heading:"Heading",dualHeading:"Dual-color heading",iconBox:"Icon box",text:"Text",image:"Image",gallery:"Gallery",video:"Video",cta:"Call to action",columns:"Columns",features:"Features",testimonials:"Testimonials",pricing:"Pricing",faq:"FAQ",stats:"Stats",button:"Button",divider:"Divider",spacer:"Spacer",html:"HTML (text only)"};
export const defaultBlockData:Record<string,Record<string,any>>={
 hero:{headline:"A better way to tell your story",subheadline:"Bring your website to life, visually.",buttonText:"Get started",buttonUrl:"#",alignment:"left"},
 heading:{text:"Your next section"}, dualHeading:{before:"Design",accent:"without limits",after:"with PinCMS"}, iconBox:{icon:"✦",title:"Made for you",content:"A flexible visual component.",url:"#"}, text:{content:"Start writing your story here..."},
 image:{src:"",alt:"Describe this image",caption:""},gallery:{images:[{src:"",alt:""}]},video:{src:""},
 cta:{headline:"Ready for the next step?",description:"Let's build something great together.",buttonText:"Contact us",buttonUrl:"#"},
 columns:{items:[{title:"Purpose",content:"Add a few words."},{title:"Craft",content:"Tell your story."},{title:"Results",content:"Share your impact."}]},
 features:{items:[{title:"Fast",content:"Made for speed."},{title:"Flexible",content:"Designed for you."},{title:"Beautiful",content:"Look great."}]},
 testimonials:{items:[{title:"Our customer",content:"This changed how we work."}]},
 pricing:{items:[{title:"Starter",content:"Made for your first website."},{title:"Growth",content:"Built to scale."}]},
 faq:{items:[{question:"What is PinCMS?",answer:"A modern website editor for Next.js."}]},stats:{items:[{value:"100%",label:"Your content"}]},
 button:{label:"Read more",url:"#"},divider:{},spacer:{height:"md"},html:{code:"<p>For safety, HTML blocks render as escaped source.</p>"}
};
