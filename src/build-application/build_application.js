﻿/**
 * @fileoverview
 * (This file was autogenerated by opprotoc)
 *
 * The application is created in two steps:
 *
 * Step 1: All objects that do not depend on the services available from the
 *         debuggee. The only exception is the scope service, as it is needed
 *         to query the debuggee about what services it provides. All scope
 *         debuggees run the scope service, and it can not be disabled.
 *
 * Step 2: All service objects are created, based on their counterpart on
 *         the debuggee side. The second step uses
 *         a pattern where each service has a build function in
 *         "app.builders.<servuce class name>.<service version>.
 *         The builders are called as soon as service information have been
 *         received from the scope service. It's possible to hook up a callback
 *         after the second step has finished. The callback can either be
 *         passed as an argument to the build_application call, or by defining
 *         a function named window.app.on_services_created, which
 *         will be called automatically
 *
 *
 * There is an other moment to hook up a callback.
 * That is when all services are sucessfully enabled.
 * The callback can either be passed to the build_application call
 * as second argument or by defining a function named
 * window.app.on_services_enabled
 *
 */

if( window.app )
{
  throw "window.app does already exist";
}
window.app = {};

/** 
  * If the connected host has a core intergation point prior to 168 the 
  * application will reload an according older application version.
  * Core integartion 168 supports the following service versions:
  *
  *   scope:               1.1
  *   console-logger:      2.0
  *   cookie-manager:      1.1.1
  *   document-manager:    1.1
  *   http-logger:         2.0
  *   exec:                2.1
  *   window-manager:      2.1
  *   widget-manager:      1.0
  *   resource-manager:    1.1
  *   prefs:               1.0
  *   ecmascript:          1.0
  *   ecmascript-debugger: 6.6
  *
  * "http-logger" is not present in this build. 
  * It is replaced by the "resource-manager". 
  *
  */
window.app.MIN_SUPPORTED_CORE_VERSION = 168;

window.cls.MessageMixin.apply(window.app); // Give the app object message handling powers

window.app.build_application = function(on_services_created, on_services_enabled)
{

  var _find_compatible_version = function(version, version_list)
  {
    var
    numbers = version.split(".").map(Number),
    match = null,
    ver, nums;
     // Find the best match for the current version
    for (ver in version_list)
    {
      nums = ver.split(".").map(Number);
      if (nums[0] != numbers[0])
        continue;
      if (!match || (nums[1] > match[1][1] && nums[1] <= numbers[1]))
        match = [ver, nums];
    }
    return match && match[0];
  }

  var on_host_info_callback = function(service_descriptions, hello_message)
  {
    var core_version = hello_message.coreVersion;
    var core_integration = core_version && parseInt(core_version.split('.')[2]);
    if (core_integration >= window.app.MIN_SUPPORTED_CORE_VERSION)
    {
      new window.cls.ScopeInterfaceGenerator().get_interface(service_descriptions,
        function(map)
        {
          window.message_maps = map;
          window.cls.ServiceBase.populate_map(map);
          build_and_enable_services(service_descriptions, map);
        },
        function(error)
        {
          opera.postError(error.message);
        },
        Boolean(window.ini.debug)
      );
    }
    else
    {
      window.client.handle_fallback("ci-168");
    }
  };

  /**
   * This callback is invoked when host info is received from the debuggee.
   *
   */
  var build_and_enable_services = function(service_descriptions, map)
  {
    var
    service_name = '',
    service = null,
    class_name = '',
    re_version = /(^\d+\.\d+)(?:\.\d+)?$/,
    version = null,
    i = 0,
    builder = null,
    numbers = null;

    for (service_name in service_descriptions)
    {
      service = service_descriptions[service_name];
      version = re_version.exec(service.version);
      version = version && version[1] || "0";
      class_name = window.app.helpers.dash_to_class_name(service_name);
      if (service_name != "scope")
      {
        if (window.services[service_name] &&
          window.services[service_name].create_and_expose_interface(version, map[service_name]))
        {
          var
          match_version = _find_compatible_version(version, window.app.builders[class_name]),
          builder = window.app.builders[class_name] && window.app.builders[class_name][match_version];
          if (builder)
          {
            // service_description is a dict of services
            // with name and version for each service
            // return false if the service shall not be enabled
            window.services[service_name].is_implemented = builder(service, service_descriptions);
          }
        }
      }
    }
    window.app.post('services-created', {'service_description': service_descriptions});
    if (window.app.on_services_created)
    {
      window.app.on_services_created(service_descriptions);
    }
    if (on_services_created)
    {
      on_services_created(service_descriptions);
    }
    for (service_name in service_descriptions)
    {
      if(service_name in window.services &&
            window.services[service_name].is_implemented &&
            service_name != "scope")
      {
        window.services['scope'].requestEnable(0,[service_name]);
      }
    }
  }

  var create_raw_interface = function(service_name)
  {
    var ServiceClass = function()
    {
      this.name = service_name;
      this.is_implemented = false;
    }
    ServiceClass.prototype = new cls.ServiceBase();
    ServiceClass.prototype.constructor = ServiceClass;  // this is not really needed
    window.services.add(new ServiceClass());
  }

  var report_usage = function()
  {
    if (settings.general.get("track-usage"))
    {
      var trackerurl = "/app/user-count"
      var tracker = new cls.UserTracker(trackerurl);
      var cb = function(status, url)
      {
        if (status != 200)
        {
          opera.postError("Usertracker could not send heartbeat to tracker server at " + url + ". Got status " + status);
        }
      };
      tracker.call_home(cb);
    }
  }

  // ensure that the static methods on cls.ServiceBase exist.
  new cls.ServiceBase();
  new ActionBroker();

  window.messages.addListener("application-setup", report_usage);

  // global objects
  window.tagManager = window.tag_manager = new window.cls.TagManager();
  window.helpers = new cls.Helpers();

  // create window.services namespace and register it.
  cls.ServiceBase.register_services(new cls.Namespace("services"));
  [
    'scope',
    'console-logger',
    'window-manager',
    'profiler'
  ].forEach(create_raw_interface);
  var params = this.helpers.parse_url_arguments();
  if(params.debug)
  {
    cls.debug.create_debug_environment(params);
  }
  var namespace = cls.Scope && cls.Scope["1.1"];
  namespace.Service.apply(window.services.scope.constructor.prototype);
  window.services.scope.is_implemented = true;
  window.services.scope.set_host_info_callback(on_host_info_callback);
  window.services.scope.set_services_enabled_callback(on_services_enabled);

  /* Instatiations needed to setup the client */

  /* General */
  cls.GeneralView.prototype = ViewBase;
  new cls.GeneralView('general', ui_strings.M_SETTING_LABEL_GENERAL, '');
  cls.GeneralView.create_ui_widgets();

  /* Monospace font selection */
  cls.MonospaceFontView.prototype = ViewBase;
  var view = new cls.MonospaceFontView('monospacefont',
                                       ui_strings.M_VIEW_LABEL_MONOSPACE_FONT);
  cls.MonospaceFontView.create_ui_widgets();
  view.set_font_style();

  /* Debug remote */
  cls.DebugRemoteSettingView.prototype = ViewBase;
  new cls.DebugRemoteSettingView('debug_remote_setting', ui_strings.S_SWITCH_REMOTE_DEBUG, '');
  cls.DebugRemoteSettingView.create_ui_widgets();

  /* PO tester */
  new cls.PoTestView("test-po-file", "Test PO file", "scroll");

  /* Shortcut config */
  var GlobalView = function(id, name)
  {
    this.init(id, name);
  };
  GlobalView.prototype = ViewBase;
  new GlobalView(ActionBroker.GLOBAL_HANDLER_ID, ui_strings.S_GLOBAL_KEYBOARD_SHORTCUTS_SECTION_TITLE);
  cls.ShortcutConfigView.prototype = ViewBase;
  // this is the only sub-section in it's settings tab, therefor it doesn't need a title
  new cls.ShortcutConfigView('shortcut-config', '', '');
  cls.ShortcutConfigView.create_ui_widgets();

  /* Modebar */
  cls.ModebarView.prototype = ViewBase;
  new cls.ModebarView('modebar', '', '');
  cls.ModebarView.create_ui_widgets();

  // create the client
  if(window.services.scope)
  {
    window.ui_framework.setup();
    window.client = new cls.Client();
    client.setup();
    messages.post('application-setup');
  }
  else
  {
    throw "scope service couldn't be created, application creation aborted";
  }
}

/**
  * The builders for each service and version.
  * These calls can also be used to create other parts of the application
  * which support a given service version.
  * It is recommended ( but not required ) that classes which support a given
  * service version are organized in an appropirate namespace, like
  * ls.<service class name>.<service version>.
  */
window.app.builders = {};

window.app.helpers = {};

window.app.helpers.parse_url_arguments = function()
{
  /*
    supported arguments:
      - debug
      - log-filter
  */
  var
  args = location.search.slice(1).split(';'),
  params = {},
  arg = '',
  i = 0;

  for( ; arg = args[i]; i++)
  {
    arg = arg.split('=');
    params[arg[0].replace(/^ +/, '').replace(/ +$/, '')] =
      arg[1] && arg[1].replace(/^ +/, '').replace(/ +$/, '') || true;
  }
  return params;
}

window.app.helpers.dash_to_class_name = function(name)
{
  for ( var cur = '', i = 0, ret = '', do_upper = true; cur = name[i]; i++)
  {
    if(cur == '-')
    {
      do_upper = true;
      continue;
    }
    ret += do_upper && cur.toUpperCase() || cur;
    do_upper = false;
  }
  return ret;
}


window.onload = function()
{
  window.clearTimeout(window.load_screen_timeout);
  new OperaDBLclickMenuController();
  window.app.build_application();
}

