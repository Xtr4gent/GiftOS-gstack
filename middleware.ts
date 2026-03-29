export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/gifts/:path*", "/history/:path*", "/settings/:path*"],
};
