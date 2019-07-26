using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc;
using ElectronNET.API;

namespace ElectronNET {
  public class Startup {
    // This method gets called by the runtime. Use this method to add services to the container.
    // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
    public void ConfigureServices(IServiceCollection services) {
      services.AddMvc().SetCompatibilityVersion( CompatibilityVersion.Version_2_2 );
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env) {
      if (env.IsDevelopment()) {
        app.UseDeveloperExceptionPage();
        //app.UseBrowserLink();
      }
      else {
        app.UseExceptionHandler( "/Default/Error" );
        // The default HSTS value is 30 days.You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
      }

      //app.UseHttpsRedirection();
      app.UseStaticFiles();
      app.UseCookiePolicy();

      //app.UseMvc( routes => {
      //  routes.MapRoute(
      //      name: "default",
      //      template: "{controller=Home}/{action=Index}/{id?}" );
      //} );
      app.UseMvc(); // use attribute routes

      // Open the Electron-Window here
      Task.Run( async () => await Electron.WindowManager.CreateWindowAsync() );
    }
    
  }

}
