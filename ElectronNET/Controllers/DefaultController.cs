using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNetCore.Mvc;

namespace ElectronNET.Controllers {
  public class DefaultController : Controller {

    [Route( "" )]
    public ActionResult Index() {
      return View();
    }

    [Route( "about" )]
    public ActionResult About() {
      ViewBag.Message = "Your application description page.";

      return View();
    }

    [Route( "contact" )]
    public ActionResult Contact() {
      ViewBag.Message = "Your contact page.";

      return View();
    }
  }
}