﻿/**
 * @constructor
 * @extends UIBase
 */
var HorizontalNavigation = function(cell)
{
  this.type = 'horizontal-navigation';

  var last_dir = null;
  var current_breadcrumb_el = null;

  /**
   * Updates the list of breadcrumbs.
   *
   * @param {Array} template_list A list of breadcrumbs as a template
   * @param {Boolean} focus_end Whether or not to focus the last item
   */
  this.set_content = function(template_list, focus_end)
  {
    this.breadcrumbs.clearAndRender(template_list);
    this.check_width();
    if (focus_end)
    {
      //this.set_position(TODO);
    }
    else
    {
      this.breadcrumbs.style.removeProperty("left");
    }
  };

  /**
   * Navigates in the given direction.
   *
   * @param {String|int} dir One of the following:
   *                         - "back": Navigates one breadcrumb back
   *                         - "forward": Navigates one breadcrumb forward
   *                         - An integer: Navigates this many pixels
   *
   */
  this.nav = function(dir)
  {
    var left = 0;
    var pos = parseInt(getComputedStyle(this.breadcrumbs, null).left);
    var breadcrumbs_dim = this.breadcrumbs.getBoundingClientRect();
    var element = (last_dir == dir) ? current_breadcrumb_el : null;
    last_dir = dir;

    if (dir == "back")
    {
      if (!element)
      {
        element = this.breadcrumbs.querySelectorAll("breadcrumb")[0];
        while (element && element.getBoundingClientRect().right < this.nav_back.offsetWidth)
        {
            element = element.nextElementSibling;
        }
      }

      if (element)
      {
        var left_edge = element.getBoundingClientRect().left;
        left = this.nav_back.getBoundingClientRect().right - left_edge;
        element = element.previousElementSibling;
      }
    }
    else if (dir == "forward")
    {
      if (!element)
      {
        element = this.breadcrumbs.querySelectorAll("breadcrumb")[0];
        while (element && element.getBoundingClientRect().right - 1 <= this.nav_forward.offsetLeft)
        {
            element = element.nextElementSibling;
        }
      }

      if (element)
      {
        var right_edge = element.getBoundingClientRect().right - breadcrumbs_dim.left;
        left = breadcrumbs_dim.width - right_edge;
        element = element.nextElementSibling;
      }
    }
    else if (typeof dir == "number")
    {
      left += dir;
    }

    this.breadcrumbs.style.OTransitionDuration = Math.min(Math.abs(left) / 200, .2) + "s";
    this.set_position(pos + left);
  };

  /**
   * Sets the left position of the breadcrumbs. This method does boundary checking,
   * so the breadcrumbs never overflow on any direction.
   *
   * @param {int} left The left position of the breadcrumbs
   */
  this.set_position = function(left)
  {
    if (this.element.hasClass("navs"))
    {
      var breadcrumb_eles = this.breadcrumbs.querySelectorAll("breadcrumb");
      var last = breadcrumb_eles[breadcrumb_eles.length-1];
      //if (last.getBoundingClientRect().right > this.breadcrumbs.nextElementSibling.offsetLeft) {
      this.breadcrumbs.style.left = Math.max(Math.min(this.nav_back.offsetWidth, left), this.nav_forward.offsetLeft - this.breadcrumbs.scrollWidth + 1) + "px";
      //}
    }
  };

  /**
   * Checks the width of the breadcrumbs, and if necessary shows the navigation
   * buttons.
   */
  this.check_width = function()
  {
    current_breadcrumb_el = null;
    if (this.breadcrumbs.scrollWidth > this.breadcrumbs.offsetWidth)
    {
      this.element.addClass("navs");
    }
    else
    {
      this.element.removeClass("navs");
      this.breadcrumbs.style.removeProperty("left");
    }

    this.check_position();
  };

  /**
   * Checks the position of the breadcrumbs, and if necessary, disables a navigation
   * button if it's not possible to go further in that direction.
   */
  this.check_position = function()
  {
    var left = parseInt(this.breadcrumbs.style.left);
    if (left == this.nav_back.offsetWidth || isNaN(left))
    {
      this.nav_back.addClass("disabled");
    }
    else
    {
      this.nav_back.removeClass("disabled");
    }

    if (this.breadcrumbs.offsetWidth == this.breadcrumbs.scrollWidth)
    {
      this.nav_forward.addClass("disabled");
    }
    else
    {
      this.nav_forward.removeClass("disabled");
    }
  };

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();

    this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    this.element.render(window.templates.horizontal_navigation_content());
    this.breadcrumbs = this.element.querySelector("breadcrumbs");
    this.breadcrumbs.addEventListener("OTransitionEnd", this.check_position.bind(this), false);
    this.nav_back = this.element.querySelector("nav[dir='back']");
    this.nav_forward = this.element.querySelector("nav[dir='forward']");
  };

  this.init(cell);
};

HorizontalNavigation.prototype = UIBase;

