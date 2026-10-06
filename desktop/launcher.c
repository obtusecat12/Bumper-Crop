#define UNICODE
#define _UNICODE
#include <winsock2.h>
#include <windows.h>
#include <shlobj.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>
static wchar_t root[32768];
static SOCKET listener;
static const char *mime(const wchar_t *p){
 const wchar_t *e=wcsrchr(p,L'.'); if(!e)return "application/octet-stream";
 if(!_wcsicmp(e,L".js"))return "text/javascript; charset=utf-8";
 if(!_wcsicmp(e,L".html"))return "text/html; charset=utf-8";
 if(!_wcsicmp(e,L".css"))return "text/css";
 if(!_wcsicmp(e,L".json"))return "application/json";
 if(!_wcsicmp(e,L".webp"))return "image/webp";
 if(!_wcsicmp(e,L".png"))return "image/png";
 if(!_wcsicmp(e,L".jpg"))return "image/jpeg";
 if(!_wcsicmp(e,L".svg"))return "image/svg+xml";
 if(!_wcsicmp(e,L".wasm"))return "application/wasm";
 if(!_wcsicmp(e,L".woff2"))return "font/woff2";
 if(!_wcsicmp(e,L".mp3"))return "audio/mpeg";
 if(!_wcsicmp(e,L".ogg"))return "audio/ogg";
 return "application/octet-stream";
}
static int sendall(SOCKET s,const char *p,int n){while(n>0){int k=send(s,p,n,0);if(k<=0)return 0;p+=k;n-=k;}return 1;}
static DWORD WINAPI request(void *arg){
 SOCKET s=(SOCKET)(ULONG_PTR)arg; char buf[16384],method[16],url[8192]; int n=0,k; DWORD timeout=10000;
 setsockopt(s,SOL_SOCKET,SO_RCVTIMEO,(char*)&timeout,sizeof(timeout));
 setsockopt(s,SOL_SOCKET,SO_SNDTIMEO,(char*)&timeout,sizeof(timeout));
 while(n<(int)sizeof(buf)-1){k=recv(s,buf+n,sizeof(buf)-1-n,0);if(k<=0)goto end;n+=k;buf[n]=0;if(strstr(buf,"\r\n\r\n"))break;}
 if(sscanf(buf,"%15s %8191s",method,url)!=2)goto end;
 if(strcmp(method,"GET")&&strcmp(method,"HEAD")){const char *e="HTTP/1.1 405 Method Not Allowed\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";sendall(s,e,(int)strlen(e));goto end;}
 char *query=strchr(url,'?');if(query)*query=0;
 char decoded[8192];int j=0;
 for(int i=0;url[i]&&j<8190;i++){unsigned v;if(url[i]=='%'&&url[i+1]&&url[i+2]&&sscanf(url+i+1,"%2x",&v)==1){if(!v)goto end;decoded[j++]=(char)v;i+=2;}else decoded[j++]=url[i];}decoded[j]=0;
 if(decoded[0]!='/'||strstr(decoded,"..")||strchr(decoded,'\\')||strchr(decoded,':'))goto missing;
 if(!strcmp(decoded,"/"))strcpy(decoded,"/index.html");
 wchar_t relative[8192],path[32768];
 if(!MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,decoded,-1,relative,8192))goto missing;
 swprintf(path,32768,L"%ls%ls",root,relative);
 HANDLE f=CreateFileW(path,GENERIC_READ,FILE_SHARE_READ,NULL,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,NULL);if(f==INVALID_HANDLE_VALUE)goto missing;
 LARGE_INTEGER size;GetFileSizeEx(f,&size);
 int h=snprintf(buf,sizeof(buf),"HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %lld\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n",mime(path),size.QuadPart);
 if(sendall(s,buf,h)&&strcmp(method,"HEAD")){DWORD got;while(ReadFile(f,buf,sizeof(buf),&got,NULL)&&got){if(!sendall(s,buf,(int)got))break;}}
 CloseHandle(f);goto end;
 missing: {const char *e="HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";sendall(s,e,(int)strlen(e));}
 end: shutdown(s,SD_BOTH);closesocket(s);return 0;
}
static DWORD WINAPI serve(void *unused){(void)unused;for(;;){SOCKET s=accept(listener,NULL,NULL);if(s==INVALID_SOCKET)break;HANDLE t=CreateThread(NULL,0,request,(void*)(ULONG_PTR)s,0,NULL);if(t)CloseHandle(t);else closesocket(s);}return 0;}
static void error(const wchar_t *msg){MessageBoxW(NULL,msg,L"Backrooms V98",MB_OK|MB_ICONERROR);}
int WINAPI wWinMain(HINSTANCE a,HINSTANCE b,PWSTR args,int show){
 (void)a;(void)b;(void)args;(void)show;
 HANDLE mutex=CreateMutexW(NULL,FALSE,L"Local\\BackroomsV98Desktop");if(GetLastError()==ERROR_ALREADY_EXISTS){MessageBoxW(NULL,L"Game is already running. Use Alt+Tab to return to it.",L"Backrooms V98",MB_OK);return 0;}
 GetModuleFileNameW(NULL,root,32768);wchar_t *slash=wcsrchr(root,L'\\');if(!slash)return 1;*slash=0;wcscat(root,L"\\game");
 wchar_t check[32768];swprintf(check,32768,L"%ls\\index.html",root);if(GetFileAttributesW(check)==INVALID_FILE_ATTRIBUTES){error(L"Game files are missing. Please reinstall Backrooms V98.");return 1;}
 wchar_t edge[32768],base[32768];const wchar_t *envs[]={L"ProgramFiles(x86)",L"ProgramFiles",L"LOCALAPPDATA"};int found=0;
 for(int i=0;i<3;i++){if(GetEnvironmentVariableW(envs[i],base,32768)){swprintf(edge,32768,L"%ls\\Microsoft\\Edge\\Application\\msedge.exe",base);if(GetFileAttributesW(edge)!=INVALID_FILE_ATTRIBUTES){found=1;break;}}}
 if(!found){error(L"Microsoft Edge is required. Install Microsoft Edge, then launch the game again.");return 1;}
 WSADATA ws;if(WSAStartup(MAKEWORD(2,2),&ws)){error(L"Unable to start local game service.");return 1;}
 listener=socket(AF_INET,SOCK_STREAM,IPPROTO_TCP);BOOL exclusive=TRUE;setsockopt(listener,SOL_SOCKET,SO_EXCLUSIVEADDRUSE,(char*)&exclusive,sizeof(exclusive));
 struct sockaddr_in addr={0};addr.sin_family=AF_INET;addr.sin_addr.s_addr=htonl(INADDR_LOOPBACK);addr.sin_port=htons(19898);
 if(bind(listener,(struct sockaddr*)&addr,sizeof(addr))||listen(listener,SOMAXCONN)){error(L"Local port 19898 is in use. Close the previous game or application using that port, then retry.");return 1;}
 HANDLE thread=CreateThread(NULL,0,serve,NULL,0,NULL);if(!thread)return 1;
 SHGetFolderPathW(NULL,CSIDL_LOCAL_APPDATA,NULL,0,base);
 wchar_t cmd[65536];swprintf(cmd,65536,L"\"%ls\" --user-data-dir=\"%ls\\BackroomsV98\\BrowserProfile\" --no-first-run --disable-background-mode --start-fullscreen --app=http://127.0.0.1:19898/",edge,base);
 STARTUPINFOW si={0};si.cb=sizeof(si);PROCESS_INFORMATION pi={0};
 if(!CreateProcessW(edge,cmd,NULL,NULL,FALSE,0,NULL,NULL,&si,&pi)){error(L"Unable to open Microsoft Edge.");closesocket(listener);return 1;}
 WaitForSingleObject(pi.hProcess,INFINITE);CloseHandle(pi.hThread);CloseHandle(pi.hProcess);
 closesocket(listener);WaitForSingleObject(thread,1000);CloseHandle(thread);WSACleanup();CloseHandle(mutex);return 0;
}
