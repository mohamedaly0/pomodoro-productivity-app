// localAuthStub.js
window.auth={isAuthenticated:()=>true,isLoggedIn:()=>true,getCurrentUser:()=>({id:'local-user',name:'Guest User'}),getToken:()=>null,makeAuthenticatedRequest:(url,opt={})=>fetch(url,opt)};console.log('[localAuthStub] active');
