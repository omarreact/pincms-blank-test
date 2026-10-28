/** PinCMS-native equivalents of Elementor's catalog; integrations remain explicitly gated. */
export const extraLabels:Record<string,string>={
 container:"Container",row:"Row",column:"Column",grid:"Grid",
 googleMaps:"Google Maps",icon:"Icon",imageBox:"Image Box",counter:"Counter",testimonial:"Testimonial",
 accordion:"Accordion",toggle:"Toggle",soundCloud:"SoundCloud",shortcode:"Shortcode",menuAnchor:"Menu Anchor",readMore:"Read More",textPath:"Text Path",sidebar:"Sidebar",
 loopGrid:"Loop Grid",loopCarousel:"Loop Carousel",offCanvas:"Off Canvas",posts:"Posts",portfolio:"Portfolio",
 login:"Login",slides:"Slides",animatedHeadline:"Animated Headline",hotspot:"Hotspot",priceList:"Price List",priceTable:"Price Table",flipBox:"Flip Box",
 mediaCarousel:"Media Carousel",testimonialCarousel:"Testimonial Carousel",reviews:"Reviews",tableOfContents:"Table of Contents",shareButtons:"Share Buttons",blockquote:"Blockquote",
 facebookButton:"Facebook Button",facebookComments:"Facebook Comments",facebookEmbed:"Facebook Embed",facebookPage:"Facebook Page",
 template:"Saved Template",lottie:"Lottie",codeHighlight:"Code Highlight",videoPlaylist:"Video Playlist",progressTracker:"Progress Tracker",navMenu:"Nav Menu",carousel:"Carousel",taxonomyFilter:"Taxonomy Filter",linkInBio:"Link in Bio",
 siteLogo:"Site Logo",siteTitle:"Site Title",pageTitle:"Page Title",wpMenu:"WordPress Menu",sitemap:"Sitemap",postTitle:"Post Title",postExcerpt:"Post Excerpt",featuredImage:"Featured Image",postContent:"Post Content",authorBox:"Author Box",postComments:"Post Comments",postNavigation:"Post Navigation",postInfo:"Post Info",search:"Search",breadcrumbs:"Breadcrumbs",archiveTitle:"Archive Title",archivePosts:"Archive Posts",archiveDescription:"Archive Description",
 productTitle:"Product Title",productBreadcrumbs:"Product Breadcrumbs",productImages:"Product Images",productPrice:"Product Price",addToCart:"Add to Cart",productRating:"Product Rating",productStock:"Product Stock",productMeta:"Product Meta",shortDescription:"Short Description",productDataTabs:"Product Data Tabs",additionalInformation:"Additional Information",relatedProducts:"Related Products",upsells:"Upsells",products:"Products",archiveProducts:"Archive Products",customAddToCart:"Custom Add to Cart",productCategories:"Product Categories",menuCart:"Menu Cart",cart:"Cart",checkout:"Checkout",myAccount:"My Account",purchaseSummary:"Purchase Summary",wooNotices:"WooCommerce Notices",paypalButton:"PayPal Button",stripeButton:"Stripe Button"
};
/** Widgets that require WordPress, WooCommerce, external provider credentials, or server data. */
export const integrationWidgets=new Set([
 "shortcode","sidebar","login","facebookComments","facebookEmbed","facebookPage","template","taxonomyFilter",
 "wpMenu","siteLogo","postTitle","postExcerpt","featuredImage","postContent","authorBox","postComments","postNavigation","postInfo","archiveTitle","archiveDescription",
 "productTitle","productBreadcrumbs","productImages","productPrice","addToCart","productRating","productStock","productMeta","shortDescription","productDataTabs","additionalInformation","relatedProducts","upsells","products","archiveProducts","customAddToCart","productCategories","menuCart","cart","checkout","myAccount","purchaseSummary","wooNotices","paypalButton","stripeButton"
]);
const cards=()=>[{title:"First item",content:"Edit this item to tell your story.",url:"#",src:""},{title:"Second item",content:"Add a second item.",url:"#",src:""}];
function defaults(type:string):Record<string,unknown>{
 if(["container","column"].includes(type))return {children:[],direction:"column",gap:16,padding:"16px"};
 if(type==="row")return {children:[],direction:"row",gap:16};
 if(type==="grid")return {children:[],direction:"grid",gap:16};
 if(integrationWidgets.has(type))return {title:extraLabels[type],content:"Requires a connected data provider",provider:""};
 if(["priceList","priceTable"].includes(type))return {items:[{title:"Starter",price:"$29 / mo",content:"A great starting point",url:"#"}, {title:"Business",price:"$79 / mo",content:"Everything you need",url:"#"}]};
 if(["accordion","toggle","priceList","priceTable","slides","mediaCarousel","testimonialCarousel","reviews","videoPlaylist","carousel","navMenu","linkInBio"].includes(type))return {items:cards()};
 if(type==="googleMaps")return {location:"Dhaka, Bangladesh",zoom:"13",title:"Location"};
 if(type==="soundCloud")return {src:"",title:"Audio player"};
 if(type==="siteTitle"||type==="pageTitle")return {text:"Page title"};
 if(type==="animatedHeadline")return {before:"Build ",accent:"something amazing",after:" today"};
 if(type==="counter")return {value:"100",label:"Happy clients",prefix:"",suffix:"+"};
 if(type==="hotspot")return {src:"",title:"Feature image",items:[{title:"Hotspot",content:"Feature detail",x:"50",y:"50"}]};
 if(type==="flipBox")return {title:"Front of card",content:"Back of card",buttonText:"Learn more",url:"#"};
 if(type==="blockquote")return {content:"A thoughtful quote goes here.",title:"Author"};
 if(type==="codeHighlight")return {code:"console.log('Hello PinCMS')",language:"javascript"};
 if(type==="lottie")return {src:"",title:"Animation JSON URL"};
 if(type==="offCanvas")return {title:"Open panel",content:"Your panel content here"};
 if(type==="search")return {title:"Search pages",placeholder:"Search...",url:"/"};
 if(type==="progressTracker")return {label:"Reading progress"};
 if(type==="readMore")return {title:"Read more",content:"Continue reading...",url:"#"};
 if(type==="textPath")return {text:"Creative typography"};
 if(type==="facebookButton")return {title:"Follow on Facebook",url:"https://facebook.com"};
 if(type==="shareButtons")return {title:"Share this page"};
 if(type==="sitemap")return {items:[{title:"Home",url:"/"},{title:"About",url:"/about"}]};
 if(type==="breadcrumbs")return {title:"Home / Current page"};
 if(type==="icon")return {icon:"✦",title:"Icon"};
 if(type==="imageBox")return {title:"Image Box",content:"Description",src:"",url:"#"};
 if(type==="testimonial")return {title:"Customer name",content:"A wonderful testimonial"};
 if(type==="menuAnchor")return {anchor:"section"};
 return {title:extraLabels[type]||type,content:"Edit this widget",url:"#",src:""};
}
export const extraDefaults:Record<string,Record<string,unknown>>=Object.fromEntries(Object.keys(extraLabels).map(t=>[t,defaults(t)]));
