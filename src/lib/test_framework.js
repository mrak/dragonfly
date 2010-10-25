﻿/**
 * (This file was autogenerated by hob)
 *
 * @fileoverview
 * fixme: add fileoverview
 */

window.cls || ( window.cls = {} );

/**
  * @constructor 
  */

window.cls.TestFramework = function()
{
  /**
    * class to inspect and test the scope interface
    *
    * the class expects the following markup:
    *
    *   <ul id="window-list"></ul> optional
    *
    *   <ul id="service-list">
    *     <li>Scope</li>
    *     <li>WindowManager</li>
    *     <li>EcmascriptDebugger</li>
    *     <li>HttpLogger</li>
    *     etc
    *   </ul>
    *
    *   <ul id="command-list"></ul>
    *
    *   <ul id="event-list"></ul>
    *
    *   <div id="message-container"></div>
    *
    *  the two methods `get_bound_click_handler` 
    *  and `get_bound_change_handler` must be set to
    *  an appropriated event listeners
    *
    */

  /* interface */

  this.get_bound_click_handler = function(){};
  this.get_bound_change_handler = function(){};
  /**
    * to clear the log entries
    */
  this.clear_log = function(){};
  this.rebuild_last_state = function(){};

  this.rebuild_last_state = function(){};

  /* privat */
  
  this._selected_service = "";
  this._status_map = cls.ServiceBase.get_status_map();
  this._event_map = cls.ServiceBase.get_event_map();
  this._service_descriptions = null;

  const INDENT = "  ", RESPONSE = 2;

  this._get_indent = function(count)
  {
    var ret = "";
    while(count-- > 0)
    {
      ret += INDENT;
    }
    return ret;
  }


  this._pretty_print_payload_item = function(indent, name, definition, item)
  {
    return (
      this._get_indent(indent) +
      name + ': ' + (
        item === null && "null" || 
        "message" in definition && "\n" + 
            this._pretty_print_payload(item, definition["message"], indent + 1) ||
        "enum" in definition && item in definition["enum"]["numbers"] && (definition["enum"]["numbers"][item] + " (" + item + ")") ||
        "type" in definition && definition["type"] == 11 /*bool*/ && (item ? "true" : "false") ||
        typeof item == "string" && "\"" + item + "\"" || 
        item));
  }

  this._pretty_print_payload = function(payload, definitions, indent)
  {
    var 
    ret = [], 
    item = null,
    i = 0,
    definition = null,
    j = 0;

    //# TODO message: self
    if (definitions)
    {
      for (; i < payload.length; i++)
      {
        item = payload[i];
        if (item === null)
        {
          item = [];
        }
        if (definition = definitions[i])
        {
          if (definition["q"] == "repeated")
          {
            ret.push(this._get_indent(indent) + definition['name'] + ':');
            for( j = 0; j < item.length; j++)
            {
              ret.push(this._pretty_print_payload_item(
                indent + 1,
                definition['name'].replace("List", ""),
                definition,
                item[j]));
            }
          }
          else
          {
            ret.push(this._pretty_print_payload_item(
              indent,
              definition['name'],
              definition,
              item))
          }
        }
        else
        {
          throw Error("PrettyPrintError. Probably invalid message. " +
                        "payload: " + JSON.stringify(payload));
        }
      }
      return ret.join("\n")
    }
    return "";
  }

  // handle a command response
  this._handle_response = function(status, message, service, command)
  {
    this._last_message = Array.prototype.slice.call(arguments, 0); 
    var response = document.getElementById('message-response');
    if(response)
    {
      response.parentNode.removeChild(response);
    }
    response = 
      document.getElementById('message-container').
      appendChild(document.createElement('pre'));
    response.id = 'message-response';
    service = this._dashed_name(service);
    var command_id = this._event_map[service].indexOf('handle' + command);
    var definitions = 
      window.message_maps[service] && 
      window.message_maps[service][command_id] && 
      window.message_maps[service][command_id][RESPONSE] || 
      null;
    if (status != 0) // Use the error structure if we received an error response
        definitions = window.package_map["com.opera.stp"]["Error"];
    var payload = "";
    try
    {
      payload = (cookies.get('pretty-print-message') == 'true' && definitions ?
          this._pretty_print_payload(message, definitions, 2) :
          JSON.stringify(message));
    }
    catch (e)
    {
      payload = JSON.stringify(message);
    }
    response.textContent = 
      "response:\n  status: " + 
      this._status_map[status] + "\n" +
      "  payload: \n" + 
      payload;
  }

  // to highlight the selected element in a list
  this._update_selected = function(container, target)
  {
    var selected = container && container.getElementsByClassName('selected')[0];
    if(selected)
    {
      selected.className = selected.className.replace(/ ?selected/, '');
    }
    if(target)
    {
      target.className += (target.className ? ' ' : '') + 'selected';
    }
  }

  // to upadte the Command and Evenet List
  this._update_list = function(name, list, target)
  {
    var list_ele = document.getElementById(name.toLowerCase() + '-list-container');
    list_ele.innerHTML = 
        "<h2>" + name + " List</h2><ul id='" + name.toLowerCase() + "-list'>" + 
          list.map(this._list_item).join("") + 
        "</ul>";
  }
  
  // callback to display a message definition
  this._show_def = function(xhr, context)
  {
    context.pre.innerHTML = xhr.responseText;
  }

  // to re-select entries of the Service or Command List
  this._reselect_element = function(/* list of names */)
  {
    var 
    name = '', 
    i = 0,
    j = 0,
    last_selected = '',
    lis = null, 
    li = null;

    for( ; name = arguments[i]; i++)
    {
      if(last_selected = cookies.get(name))
      {
        lis = document.getElementById(name).getElementsByTagName('li');
        for( j = 0; ( li = lis[j] ) && li.textContent != last_selected; j++);
        if(li)
        {
          this._click_handler({target: li});
        }
      }
    }
  }

  // to re-select the last selected service and command or event
  // and display the according message definitions
  this.rebuild_last_state = function()
  {
    this._reselect_element('service-list', 'command-list');
  }

  // basic helpers
  // map argument
  this._list_item = function(name)
  {
    return "<li>" + name + "</li>";
  }

  this._dashed_name = function(name)
  {
    for ( var cur = '', i = 0, ret = ''; cur = name[i]; i++)
    {
      ret += /[A-Z]/.test(cur) && ( i ? '-' : '' ) + cur.toLowerCase() || cur;
    }
    return ret;
  }

  this._make_service_descriptions = function()
  {
    var 
    map = window.message_maps,
    service_name = '', 
    command_id = '', 
    servive = null, 
    commands = null, 
    events = null;

    this._service_descriptions = {commands:{}, events: {}};
    for (service_name in map)
    {
      service = map[service_name];
      service_name = window.app.helpers.dash_to_class_name(service_name);
      commands = this._service_descriptions.commands[service_name] = [];
      events = this._service_descriptions.events[service_name] = [];
      for (command_id in service)
        (1 in service[command_id] && commands || events).push(service[command_id].name); 
      commands.sort();
      events.sort();
    }
  }

  // generic click event handler
  this._click_handler = function(event)
  {
    var target = event.target;
    if (!this._service_descriptions)
    {
      this._make_service_descriptions();
    }
    if(!this._doc_base_uri)
    {
      this._doc_base_uri = 
      document.getElementsByTagName('base')[0] ? 
      document.baseURI :
      './';
    }
    while (target && !target.id && (target = target.parentNode));
    if (target)
    {
      switch (target.id)
      {
        case 'window-list':
        {
          this._update_selected(target.parentNode, event.target);
          windows.set_debug_context(parseInt(event.target.getAttribute('data-window-id')));
          break;
        }
        case 'service-list':
        {
          this._update_selected(target, event.target);
          document.getElementById('message-container').innerHTML = "";
          this._selected_service = event.target.textContent
          this._update_list('Command', this._service_descriptions.commands[this._selected_service], target);
          this._update_list('Event', this._service_descriptions.events[this._selected_service], target);
          cookies.set('service-list', this._selected_service, 2*60*60*1000);
          break;
        }
        case 'command-list':
        {
          this._update_selected(target, event.target);
          this._update_selected(document.getElementById('event-list'));
          var message_container = document.getElementById('message-container');
          message_container.innerHTML = 
            "<h2>Command " + event.target.textContent + "</h2>" +
            "<h3>command</h3><pre class='definition'></pre>" +
            "<textarea rows='10' id='proto-message'>[]</textarea>" +
            "<p class='right-aligned'><input type='button' value='send' data-service='" + this._selected_service + "'" +
            " data-command='" + event.target.textContent + 
            "' id = 'test-send-command' /></p>" +
            "<h3>response</h3><pre class='definition'></pre>" +
              "<p class='right-aligned'><label>pretty print message " +
                "<input type='checkbox'" +
                  (cookies.get('pretty-print-message') == 'true' ? " checked='checked' " : "" ) +
                  " id='pretty-print-message' />" +
                "</label></p>";
          var pres = message_container.getElementsByTagName('pre');
          var service = window.services[this._dashed_name(this._selected_service)];
          if (service)
          {
            service = this._selected_service + '.' + service.version;
            new XMLHttpRequest().loadResource(
                this._doc_base_uri + 'defs/' + service + '.commands.' + event.target.textContent + '.def',
                this._show_def,
                {'pre': pres[0]}
              )
            new XMLHttpRequest().loadResource(
                this._doc_base_uri + 'defs/' + service + '.responses.' + event.target.textContent + '.def',
                this._show_def,
                {'pre': pres[1]}
              )
          }
          cookies.set('command-list', event.target.textContent, 2*60*60*1000);
          break;
        }
        case 'event-list':
        {
          this._update_selected(target, event.target);
          this._update_selected(document.getElementById('command-list'));
          var message_container = document.getElementById('message-container');
          message_container.innerHTML = 
            "<h2>Event " + event.target.textContent + "</h2>" +
            "<pre class='definition'></pre>";
          var pres = message_container.getElementsByTagName('pre');
          var service = window.services[this._dashed_name(this._selected_service)];
          if (service)
          {
            service = this._selected_service + '.' + service.version;
            new XMLHttpRequest().loadResource(
                this._doc_base_uri + 'defs/' + service + '.events.' + event.target.textContent + '.def',
                this._show_def,
                {'pre': pres[0]}
              );
          }
          break;
        }
        case 'test-send-command':
        {
          this._send_command(target);
          break;
        }
        case 'clear-log':
        {
          document.getElementById('log-container').firstElementChild.textContent = "";
          break;
        }
      }
    }
  }

  this._change_handler = function(event)
  {
    switch(event.target.id)
    {
      case 'pretty-print-message':
      {
        cookies.set('pretty-print-message', event.target.checked && 'true' || 'false');
        if(this._last_message)
        {
          this._handle_response.apply(this, this._last_message);
        }
        break;
      }
    }
  }

  /* implementation */
  this._send_command = function(target)
  {
    var service = target.getAttribute('data-service');
    var command = target.getAttribute('data-command');
    var response = document.getElementById('message-response');
    if(response)
    {
      response.parentNode.removeChild(response);
    }
    try
    {
      var message = eval('(' + document.getElementById('proto-message').value + ')');
      var tag = tagManager.set_callback(this, this._handle_response, [service, command]);
      services[this._dashed_name(service)]['request' + command](tag, message);
    }
    catch(e)
    {
      alert('not a valid message');
    };
  }

  this.get_bound_click_handler = function()
  {
    var self = this;
    return function(event)
    {
      self._click_handler(event);
    }
  }

  this.get_bound_change_handler = function()
  {
    var self = this;
    return function(event)
    {
      self._change_handler(event);
    }
  }

}