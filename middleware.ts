import {withAuth} from "next-auth/middleware";
export default withAuth({pages:{signIn:"/admin/login"}});
export const config={matcher:["/admin/(pages|posts|media|themes|settings|menus|forms|users|deploy)/:path*"]};
