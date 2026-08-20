var Excalibur = {
	init: function () {
		Excalibur.set_view();
		Excalibur.set_evo();
		Excalibur.set_lti_provider_variables();
		Excalibur.init_events();
		Excalibur.Mobile.init();
		Excalibur.Mobile.is_mobile_app() || Excalibur.beta_ajax();
		Excalibur.Clipboard.init();
		Excalibur.Ai.init();
		Excalibur.evo && !Excalibur.lti_provider && Excalibur.Mobile.Menu.init();
	},

	set_evo: function(){
		Excalibur.evo = Excalibur.$view.hasClass('evo');
	},

	set_lti_provider_variables: function() {
		Excalibur.lti_provider = Excalibur.$view.hasClass('lti_provider');
		Excalibur.hide_toc = Excalibur.$view.hasClass('hide_toc');
	},

	beta_ajax: function(){
		//replace code somewhere else later this func is just for testing
		if(Excalibur.$view.hasClass('user')) {
			window.tile_click = function (element_id) {
				var url = document.getElementById(element_id).querySelector('.header a').href;
				if (url.indexOf('javascript:') > -1)
					window.location = url;
				else
					Excalibur.Mobile.Router.load(url);
			};
			window.row_click = function (element_id) {
				var url = document.getElementById(element_id).querySelector('a.modern_module_overview').href;
				if (url.indexOf('javascript:') > -1)
					window.location = url;
				else
					Excalibur.Mobile.Router.load(url);
			};
			Excalibur.$view.on('click', 'a[href]:not([href^="#"]):not([href=""]):not([data-method="post"]):not([onclick]):not([data-confirm]):not([href^="javascript"]):not([excalibur-click]):not([target="_blank"]):not([data-confirm_content]):not(#purchase):not(#enroll):not(.bypass-ajax)', function (e) {
				if ($(this).attr('href').includes("open_new_window")) {
					let redirect_url = $(this).attr('href').match(/arg=([^&]*)/)[1];
					redirect_url = decodeURIComponent(redirect_url);
					redirect_url = redirect_url.replace(/['"]/g, '');

					if (is_mobile_app_mode()) {
						window.parent.postMessage("{\"method\": \"loadBrowser\", \"href\": \"" + redirect_url + "\"}", "*");
					} else {
						window.open(redirect_url);
					}
				}

				if (!Excalibur.$view.hasClass('portal_edit') && Excalibur.$view.hasClass('user') && !$(e.target).is('[type="checkbox"], label[for]') && !e.ctrlKey && !e.metaKey && !Excalibur.$view.find('.help_centre_content:visible').length) {
					// exclude materialStyle links from router load and other excalibur shenanigans
					if ($(this).closest('.materialStyle').length) {
						return;
					}
					Excalibur.Mobile.Router.load($(this).attr('href'));
					e.preventDefault();
				}
			});
		}
	},


	set_view: function(){
		Excalibur.$view = $(document.body);
	},

	init_events: function(){
		Excalibur.$view.on('click', '[excalibur-click]', function(e) {
			var $elem = $(this);
			e.stopPropagation();
			e.preventDefault();
			var to_call = $elem.attr('excalibur-click').replace(/\(.*?\)/, '');
			Excalibur.method_caller(to_call, $elem);
		});
		Excalibur.$view.on('change', '[excalibur-change]', function(e) {
			var $elem = $(this);
			e.stopPropagation();
			var to_call = $elem.attr('excalibur-change').replace(/\(.*?\)/, '');
			Excalibur.method_caller(to_call, $elem);
		});
		Excalibur.$view.on('keyup', '[excalibur-keyup]', function(e) {
			var $elem = $(this);
			e.stopPropagation();
			var to_call = $elem.attr('excalibur-keyup').replace(/\(.*?\)/, '');
			Excalibur.method_caller(to_call, $elem);
		});
		Excalibur.$view.on('scroll', '[excalibur-scroll]', function(e) {
			var $elem = $(this);
			e.stopPropagation();
			var to_call = $elem.attr('excalibur-scroll').replace(/\(.*?\)/, '');
			Excalibur.method_caller(to_call, $elem);
		});
		Excalibur.$view.on('contextmenu', '[excalibur-rclick]', function(e) {
			var $elem = $(this);
			e.stopPropagation();
			e.preventDefault();
			var to_call = $elem.attr('excalibur-rclick').replace(/\(.*?\)/, '');
			Excalibur.method_caller(to_call, $elem, e);
		});
		Excalibur.$view.on('touchstart touchend', '[excalibur-mouseover]', function(e) {
			Excalibur.is_touching = new Date();
		});
		Excalibur.$view.on('mouseenter', '[excalibur-mouseover]', function(e) {
			if(!Excalibur.touching()) {
				var $elem = $(this);
				e.preventDefault();
				var to_call = $elem.attr('excalibur-mouseover').replace(/\(.*?\)/, '');
				Excalibur.method_caller(to_call, $elem, e);
			}
		});
		Excalibur.$view.on('mouseleave', '[excalibur-mouseout]', function(e) {
			if(!Excalibur.touching()){
				var $elem = $(this);
				e.preventDefault();
				var to_call = $elem.attr('excalibur-mouseout').replace(/\(.*?\)/, '');
				Excalibur.method_caller(to_call, $elem, e);
			}
		});
		$(window).on('loadcomplete load', function() {
			Excalibur.$view.find('[excalibur-load]').each( function(){
				var $elem = $(this);
				var to_call = $elem.attr('excalibur-load').replace(/\(.*?\)/, '');
				Excalibur.method_caller(to_call, $elem);
			});
		});
		$(window).on('popstate', function(e) {
			var state = JSON.parse( e.originalEvent.state );
			if(!Excalibur.Router.router_mode && state && state.url){
				location.reload();
			}
		});
		Excalibur.$view.find('[excalibur-init]').each( function(){
			var $elem = $(this);
			var to_call = $elem.attr('excalibur-init').replace(/\(.*?\)/, '');
			Excalibur.method_caller(to_call, $elem);
		});

		Excalibur.Hit_manager.init_events();
	},

	get_obj: function(obj_string, itter, obj) {
		var objs = obj_string.split('.');
		var obj = obj ? obj[objs[itter]] : window[objs[itter]];
		itter++;
		if (typeof obj == 'function')
			return obj;
		else if (typeof obj == 'object')
			return Excalibur.get_obj(obj_string, itter, obj);
		else
			return Excalibur.method_exception;
	},

	method_caller: function(to_call, $elem, prevElem) {
		var func = Excalibur.get_obj(to_call, 0);
		if (func == Excalibur.method_exception)
			prevElem = to_call;
		func.call($elem, prevElem);
	},

	method_exception: function(func_name) {
		console.log('Exception un-handled method', $(this), func_name);
	},

	touching: function(){
		return (Excalibur.is_touching && ( new Date() - Excalibur.is_touching ) < 500);
	},

	any_click: function(ignore, context, callback){
		Excalibur.$view.one('click', {'ignore': ignore, 'context': context, 'callback': callback}, Excalibur.any_click_function);
	},

	any_click_function(e){
		var obj = e.data;
		if ( !obj.ignore || !obj.ignore.find( $(e.target) ).length )
			obj.callback && obj.callback.call( (obj.context || null) );
	},

	submit_form: function(){
		var form = this.closest('form');
		var data = form.find('input, textarea').serialize();
		var settings = this.attr('settings');
		var reload = (settings && settings.indexOf('reload') > -1) ? true : false;
		var flush_nav = (settings && settings.indexOf('flush_nav') > -1) ? true : false;
		$.post(form.attr('action'), data, function(e){
			if(reload) {
				Excalibur.Mobile.is_mobile_app() && webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.setBypassAjax'}));
				location.reload();
			}

			if(flush_nav) {
				localStorage.removeItem('mobile_nav_content');
			}
		});
		$.facebox.close();
	},

	facebox: function( data ){
		if (!data) {
			const href = this.attr('href');
			// Path only (ignore ?query / #fragment); match micromodal.js faceboxAjaxUrlIsDirectImage
			const path = (href || '').split(/[?#]/)[0];
			const isImage = /\.(gif|jpe?g|png|webp|bmp|svg|ico|avif)$/i.test(path);
			data = isImage ? { image: href } : { ajax: href };
		}
		$.facebox(data);
	},

	Router: {
		router_mode: false,
		non_routed: '',
		resources: [],

		init: function(){
			window.on_ready_functions = [];
			Excalibur.Router.router_mode = true;
			Excalibur.Router.non_routed = location.href;
			Excalibur.Router.resource_version = (Excalibur.$view.find('script[src*="?"]').length ? Excalibur.$view.find('script[src*="?"]').first().attr('src').split('?')[1] : "1");
			Excalibur.Router.init_events();
		},

		init_events: function(){
			$(window).on('popstate', function(e) {
				var state = JSON.parse( e.originalEvent.state );
				if( state && state.url ){
					state.callback_func && Excalibur.method_caller(state.callback_func, state.url);
					if( state.full_page || (Excalibur.Router.current_state && JSON.parse(Excalibur.Router.current_state).full_page ) )
						Excalibur.Mobile.Router.load( state.url, null, true );
					else
						Excalibur.Router.load( state.url, state.target_div, true );
				}
				else if( location.href.indexOf('#') < 0 )
					location.href = Excalibur.Router.non_routed;
			});
			$(window).on('preload', function( e, data ){
				Excalibur.Router.pre_load( data.html, data.url, data.obj, data.full_page );
			});
		},

		load: function( url, target_div, is_back, callback_func ){
			target_div = target_div || (window.visitor_mode ? '#contentBody' : '#centreColumn');
			url = url || this.attr('href');
			if( !navigator.onLine ) { location.href = url; return; }
			!Excalibur.Router.router_mode && Excalibur.Router.init();
			var loading_div = Excalibur.$view.find( target_div ).length ? Excalibur.$view.find( target_div ) : Excalibur.$view.find( '#centreColumn' );
			var loading = Excalibur.Location_tools.add_load_indicator( loading_div, 900 );
			$(window).trigger('beforexload', {'current_url' : location.href, 'new_url' : url, 'target_div': target_div});
			$.get( url + Excalibur.Location_tools.url_extender ( url ) + 'router=true', function( html ){
				var dom_container = $('<div></div>').append( html );
				if( Excalibur.Router.bypass_check(html, dom_container, target_div) ) {
					clearTimeout( loading );
					Excalibur.Router.clean_resources();
					!is_back && window.history.pushState(JSON.stringify({
						url: url,
						target_div: target_div,
						callback_func: callback_func
					}), null, url);

					target_div = Excalibur.Router.replace_html(html, target_div, url, dom_container);
					Excalibur.Router.current_state = history.state;
					const afterHighcharts = Excalibur.Router._highchartsReady || $.Deferred().resolve().promise();
					Excalibur.Router._highchartsReady = null;
					afterHighcharts.then(function(){
						Excalibur.Location_tools.execute_inline_scripts(html);
						$(window).trigger('loadcomplete');
					});
				}
				else {
					Excalibur.Mobile.is_mobile_app() && webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.setBypassAjax'}));
					location.href = url;
				}
			});
		},

		replace_html: function( html, target_div, url, temp ){
			target_div = target_div ? target_div : '#centreColumn';
			temp = (temp || $('<div></div>').append( html ));
			Excalibur.evo && Excalibur.Mobile.Menu.evo_add_submenu( Excalibur.$view.find('#user-menu'), temp);
			$(window).trigger('preload', {'html' : html, 'url' : url, 'obj': temp});
			target_div = temp.find( target_div ).length && Excalibur.$view.find( target_div ).length ? target_div : '#centreColumn';
			var container = Excalibur.$view.find( target_div );

			if (temp.find( target_div )[0]) {
				html = temp.find( target_div )[0].outerHTML;
				container.replaceWith(html);
			} else if (target_div === '#centreColumn' && temp.find('#contentBody')[0]) {
				html = temp.find('#contentBody')[0].outerHTML;
				let containerToReplace = Excalibur.$view.find('#contentWrap').children('#mainContent, #contentBody');
				if (containerToReplace.length) {
					containerToReplace.replaceWith(html);
				}
			}

			window.add_mobile_heading && window.add_mobile_heading(Excalibur.$view.find('.sectionTitle h1').text(), '');
			Excalibur.$view.find('.rightColumn:not(.resizable):not(.modal *)').length ? Excalibur.$view.find('#contentWrap').addClass('hasRightColumn') :  Excalibur.$view.find('#contentWrap').removeClass('hasRightColumn');
			$(window).scrollTop(0);
			return target_div;
		},

		load_left_column: function(){
			var tabs = this.closest('.tabnav');
			if( tabs.length ){
				tabs.find('.selected').removeClass('selected');
				this.addClass('selected');
			}
			var parent_container = window.visitor_mode ? '#contentBody' : '#centreColumn';
			var target_div = Excalibur.$view.find( parent_container + ' .rightColumn' ).length ? parent_container + ' .leftColumn' : parent_container;

			if( location.href.indexOf('/onboarding') > -1 || this.attr('href').indexOf('/onboarding') > -1 )
				Excalibur.Mobile.Router.load.call( this, null, null );
			else
				Excalibur.Router.load.call( this, null, target_div );
			//^^^^ this logic is special handling that should be removed later with a better solution
		},

		/// REMOVE TOC from Router after EVO finishes

		load_toc: function(){
			//load table of content page
			if( !this.hasClass('locked') ) {
				var section_nav = Excalibur.$view.find('.section_nav');
				if(section_nav.length > 0) {
					section_nav.find('ul .selected').removeClass('selected');
					if (this.hasClass('header-nav')) {
						var selected = section_nav.find('[href="' + this.attr('href') + '"]');
						selected.addClass('selected');
					}
					else
						var selected = this.addClass('selected');

					selected.length && Excalibur.Router.toc_selected(section_nav, selected);

					$(window).one('preload', function (e, data) {
						Excalibur.Router.toc_update(data.obj);
						if(!selected.length) {
							selected = section_nav.find('.selected');
							Excalibur.Router.toc_selected(section_nav, selected);
						}
					});
					Excalibur.Router.load.call(this, null, null, null, 'Excalibur.Router.toc_back');
				}
				else
					Excalibur.Mobile.Router.load.call(this);
			}
		},

		toc_back: function(){
			Excalibur.$view.find('.section_nav ul .selected').removeClass('selected');
			var target = Excalibur.$view.find('.section_nav ul [href="' + this + '"]');
			target.addClass('selected');
			$(window).one('preload', function( e, data ){
				Excalibur.Router.toc_update( data.obj );
			});
		},

		toc_update: function( $html ){
			var current_modules = Excalibur.$view.find('.section_nav .module_sections');
			var incoming_modules = $html.find('.section_nav .module_sections');
			var parent_div = current_modules.first().parent().closest('ul');
			incoming_modules.each( function( i ){
				var $elem = $(this);
				if(i > current_modules.length)
					parent_div.append($elem.closest('li'));
				else
					$(current_modules[i]).replaceWith($elem);
			});
			if(	$html.find('header > .section_progress').length )
				Excalibur.$view.find('header > .section_progress').replaceWith( $html.find('header > .section_progress') );
			if(	$html.find('.section_nav .section_progress').length )
				Excalibur.$view.find('.section_nav .section_progress').replaceWith( $html.find('.section_nav .section_progress') );
		},

		toc_selected: function(section_nav, selected){
			var to_open = selected.closest('[class*="module"]').closest('li');
			!window.expand_toc && section_nav.find('.open').removeClass('open').find('button.expand_contract').attr('aria-expanded', 'false');
			to_open.addClass('open');
			to_open.find('button.expand_contract').attr('aria-expanded', 'true');
			section_nav.find(".scrollable").getNiceScroll().resize();
		},

		load_page: function( url ){
			$(window).trigger('pageloadstart');
			url = url || this.attr('href');
			Excalibur.Router.load( url, '#wrapper' );
		},

		bypass_check: function( html, $html, target_div ){
			if(typeof html == 'string') {
				//if (($html.find('script[src*="?"]').length == 0 || $html.find('script[src*="?"]').first().attr('src').split('?')[1] == Excalibur.Router.resource_version)) {
					if( html.indexOf('FlowPaperViewer') > -1 )
						return false;
					return true;
				//}
			}
			return false;
			// temp fix delete flowpaper and column resize fixed from bypass check
		},

		pre_load: function( html, url, obj, full_page ){
			window.tinyMCE && tinyMCE.remove();
			// ^ kills tinyMCE instance before page loads or error will acoure
			const $currentHtml = $('html');
			const body_classes = html.match(/body class\='(.*?)'/);
			body_classes && body_classes[1] && $currentHtml.find('body').attr('class', body_classes[1] + ' page-loaded');
			// ^ Replace classes with incoming classes if avalible

			// Kick off Highcharts loading first so chart-using scripts injected below can wait on it.
			// Without this gate, jQuery evaluates external <script src> tags via XHR+globalEval in
			// arrival order, and modules like rounded-corners.js execute Highcharts.* at load time —
			// throwing ReferenceError when highcharts.js hasn't finished yet.
			const include_highchart = obj.find('#include-highchart');
			if (include_highchart.length) {
				Excalibur.Router.include_highchart(obj, include_highchart);
			} else {
				Excalibur.Router.include_highchart_from_tags(obj);
			}
			const afterHighcharts = Excalibur.Router._highchartsReady || $.Deferred().resolve().promise();

			afterHighcharts.then(function(){
				obj.find('script[src]').each(function(){
					const $elem = $(this);
					const is_head = $elem.parent('.to-head').length;
					if( !full_page || !$elem.closest('#contentWrap').length || is_head ) {
						const temp_url = $elem.attr('src');
						const rel = temp_url.split('?')[0];
						if (!$currentHtml.find('script[src*="' + rel + '"]').length) {
							Excalibur.Location_tools.js_load(temp_url, is_head);
							Excalibur.Router.resources.push(temp_url);
							is_head && $elem.remove();
						}
						else if( full_page && rel.indexOf('section_nav') > -1 ){
							//lame special handle for section_nav
							Excalibur.Location_tools.js_reload(temp_url);
							Excalibur.Router.resources.push(temp_url);
						}
					}
				});
			});

			obj.find('link[href][rel="stylesheet"]').each(function(){
				const temp_url = $(this).attr('href');
				if (!$currentHtml.find( 'link[href*="' + temp_url.split('?')[0] + '"]' ).length) {
					$('<link href="' + temp_url + '" media="screen" rel="stylesheet" type="text/css">').prependTo('body');
					Excalibur.Router.resources.push(temp_url);
				}
			});

			const new_section_title = obj.find('.sectionTitle').first();

			if (full_page) {
				Excalibur.$view.find('.sectionTitle').replaceWith( new_section_title[0].outerHTML );
				new_section_title.remove();
				Excalibur.$view.find('#wrapper > header .section_progress').remove();
				obj.find('#contentWrap > .section_progress').insertAfter( Excalibur.$view.find('.sectionTitle') );
				//obj.find('#page-title').length && $('head title').text(obj.find('#page-title').text());
			} else {
				Excalibur.$view.find('#wrapper > header .section_progress').replaceWith(obj.find('#contentWrap > .section_progress'));
			}

			setTimeout( function(){
				Excalibur.Router.set_custom_html(obj);
			}, 10);

			updatePageTitle(new_section_title);
		},

		include_highchart: function(obj, div){
			const scripts = div.attr('list').split(',');
			div.remove();
			Excalibur.Router._load_highchart_scripts(scripts);
		},

		// Recover Highcharts loading when the helper's SYNC branch emitted raw <script src> tags
		// (e.g., a redirect dropped the router/page_router param so the helper couldn't emit the
		// #include-highchart div). Detect those tags, strip them from obj, and route them through
		// the same sequential loader so they don't race each other via XHR+globalEval.
		include_highchart_from_tags: function(obj){
			const $tags = obj.find('script[src]').filter(function(){
				const src = $(this).attr('src') || '';
				return /\/libraries\/highcharts\/|\/javascripts\/highcharts-theme\.js/.test(src);
			});
			if (!$tags.length) return false;

			const scripts = $tags.map(function(){ return $(this).attr('src'); }).get();
			$tags.remove();

			Excalibur.Router._load_highchart_scripts(scripts);
			return true;
		},

		_load_highchart_scripts: function(scripts){
			if(window.Highcharts){
				Excalibur.Router._highchartsReady = $.Deferred().resolve().promise();
				return;
			}
			const deferred = $.Deferred();
			(function loadNext(i){
				if (i >= scripts.length) {
					deferred.resolve();
					return;
				}
				const src = scripts[i].trim();
				const matchUrl = src.split('?')[0];
				if($('script[src*="' + matchUrl + '"]').length){
					loadNext(i + 1);
					return;
				}
				const script = document.createElement('script');
				script.src = src;
				script.onload = function(){ loadNext(i + 1); };
				script.onerror = function(){ loadNext(i + 1); };
				document.head.appendChild(script);
			})(0);
			Excalibur.Router._highchartsReady = deferred.promise();
		},

		set_custom_html: function( container ){
			$('.custom-html-start').nextUntil('.custom-html-end', '*').remove();
			$('.custom-html-start, .custom-html-end').remove();
			container.find('#custom-html > script[id]').each( function(){
				var $elem = $(this);
				var html = atob( $elem.text() );
				if(html.length){
					var id = $elem.attr('id').split('-');
					if( id[1] == 'top')
						$(id[0]).prepend(html);
					else
						$(id[0]).append(html);
				}
			});
		},

		clean_resources: function(){
			$.each( Excalibur.Router.resources, function( i, url ){
				url = url.split('?')[0];
				$('script[src*="' + url + '"], link[href*="' + url + '"]').remove();
			});
			Excalibur.Router.resources = [];
		},

		send_beacon: function( url, obj, callback ){
			if( navigator && navigator.sendBeacon && !!navigator.sendBeacon.name ) {
				// For sendBeacon, create FormData instead of JSON Blob
				const formData = new FormData();
				// Add CSRF token
				obj[$('meta[name=csrf-param]').attr('content')] = $('meta[name=csrf-token]').attr('content');
				// Add each property to the FormData
				Object.keys(obj).forEach(function(key) {
					formData.append(key, typeof obj[key] === 'object' ?
						JSON.stringify(obj[key]) : obj[key]);
				});
				// Send beacon
				navigator.sendBeacon(url, formData);
				callback && callback();
			}
			else
				$.ajax({type: 'POST', url: url, data: obj, async: true, success: function () {
					callback && callback();
				}});

		}

	},

	search_obj_list: function( str, list, key, returnIndex ){
		if( list.findIndex )
			var index = list.findIndex( function(obj){ obj[key].includes( str ) });
		else
			var index = list.map(function(obj) { return obj[key]; }).indexOf(str);
		return (index > -1 && (returnIndex ? index : list[index])) || null;
	},

	run_on_ready: function(){
		window.run_on_ready_functions = true;
		for (var i = 0; i < window.on_ready_functions.length; i++) {
			try {
				on_ready_functions[i]();
			} catch (error) {
				console.log(error);
			}
		}
		window.on_ready_functions = [];
	},

	evo_toggle: function(){
		$.post('/account/set_attribute?render_nothing=true&attribute=new_user_interface&value=' + !Excalibur.evo, function() {
			if (!Excalibur.evo) {
				if (window.location.pathname.match("/themes")) {
					window.location.href = '/portal';
					return;
				}

				if (window.location.pathname.match("/organization_themes")) {
					window.location.href = '/organization/basics/' + location.pathname.split('/')[3];
					return;
				}
			}

			location.reload();
		})
	},

	Hit_manager: {
		// tool to manage multi hits
		hit_list: [],

		init_events: function(){
			$(window).on('unload', function() {
				if(Excalibur.Hit_manager.hit_list.length > 0 && Excalibur.Hit_manager.backup_url) {
					Excalibur.Router.send_beacon( Excalibur.Hit_manager.backup_url, { data : Excalibur.Hit_manager.hit_list }, function(){
						Excalibur.$view.trigger('bountycollected');
					});
				}
			});
		},

		hit_man: function( data, key, delay, url ){
			var index = Excalibur.search_obj_list( data[key], Excalibur.Hit_manager.hit_list, key, true);
			if( index )
				Excalibur.Hit_manager.hit_list[index] = data;
			else
				Excalibur.Hit_manager.hit_list.push(data);
			Excalibur.Hit_manager.backup_url = url;
			Excalibur.Hit_manager.execute_hits( delay, url );
			return Excalibur.Hit_manager.hit_list.length;
		},

		simple_hit: function( url, data, delay, target_div, callback ){
			// a simple delay function for filtering multiple calls
			clearTimeout(Excalibur.Hit_manager.timer);
			Excalibur.Hit_manager.timer = setTimeout(function() {
				if(target_div)
					Excalibur.Router.load(url, target_div, null);
				else
					$.post(url, data, function (e) {
						callback && callback(e);
					});
			}, delay);
		},

		execute_hits: function( delay, url ){
			clearTimeout(Excalibur.Hit_manager.timer);
			Excalibur.$view.trigger('hitacquired', Excalibur.Hit_manager.hit_list.length);
			Excalibur.Hit_manager.timer = setTimeout(function(){
				Excalibur.$view.trigger('hitexecuted', Excalibur.Hit_manager.hit_list.length);
				Excalibur.Router.send_beacon( url, { data : Excalibur.Hit_manager.hit_list }, function(){
					Excalibur.$view.trigger('bountycollected');
				});
				Excalibur.Hit_manager.hit_list = [];
				Excalibur.Hit_manager.backup_url = false;
			}, delay);
		},

		delay_process: function( delay, callback ){
			// a simple delay function for filtering multiple proccess calls
			clearTimeout(Excalibur.Hit_manager.timer);
			Excalibur.Hit_manager.timer = setTimeout(function() {
				callback && callback();
			}, delay);
		},
	},

	ie_support: function( url, ie_url, callback, ie_callback ){
		//returns true or false if IE, if urls specified will be included in page depending if ie or not, if callback runs callback
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf('MSIE ');
		var trident = ua.indexOf('Trident/');
		if( msie > 0 || trident > 0 ) {
			ie_url && Excalibur.Location_tools.js_load( ie_url );
			ie_callback ? ie_callback() : (callback && callback());
			return true;
		}
		else {
			url && Excalibur.Location_tools.js_load( url );
			callback && callback();
			return false;
		}
	},

	Location_tools: {
		url_extender: function(url){
			return (url.indexOf('?') > -1 ? '&' : '?');
		},

		get_rel_path: function( url ){
			return url.replace(/^(?:\/\/|[^\/]+)*\//, "");
		},

		js_reload: function( src ){
			setTimeout( function(){
				$('script[src*="' + src + '"]').remove();
				Excalibur.Location_tools.js_load( src );
			}, 5);
		},

		js_load: function( src, to_head ){
			if( !$('script[src*="' + src + '"]').length ) {
				var load_to = (to_head ? 'head' : 'body');
				$('<script src="' + src + '">').appendTo(load_to);
			}
		},

		css_load: function( url, to_head ){
			if( !$('link[href*="' + url + '"]').length ) {
				var load_to = (to_head ? 'head' : 'body');
				$('<link href="' + url + '">').appendTo(load_to);
			}
		},

		add_load_indicator: function( container, to_start ){
			return setTimeout( function(){
				container.find('.alert_block').remove();
				container.addClass('extended-load');
				$('<div class="custom-loader"><div class="bar1"></div><div class="bar2"></div><div class="bar3"></div><div class="bar4"></div><div class="bar5"></div><div class="bar6"></div></div>').appendTo(container);
				if( container.find('.tabnav').length > 0 && !container.hasClass('.temp-page') && !container.find('#fixedMarginTop').length ){
					container.addClass('with-tabs');
					Excalibur.evo && container.find('.tabnav').parent().nextAll().remove();
				}
			}, to_start);
		},

		require_js: function( url, callback ){
			try{
				callback();
			}
			catch(error){
				$.getScript( url, function() {
					callback();
				});
			}
		},

		pass_url: function( url, to_url ){
			url = url ? url : location.href;
			to_url = to_url ? to_url : this.attr('href');
			location.href = to_url + Excalibur.Location_tools.url_extender( to_url ) + 'back_url=' + url;
		},

		no_render_jobj: function( html, callback ){
			var nonLoadingDoc = document.implementation.createHTMLDocument('preview');
			var temp = nonLoadingDoc.createElement('div');
			temp.innerHTML = html;
			var $file = $(temp);
			callback( $file );
		},

		open_help: function(id){
			id = id || this.attr('href');
			location.href = id;
			$('header .quickLinks i.help').parent().click();
		},

		get_base_url: function(url){
			url = url || location.href;
			return (new URL( url ).origin);
		},

		execute_inline_scripts: function(html) {
			try {
				if (!html.jquery) html = $(html);
				let scripts = html.find("script").addBack("script");

				scripts.each(function() {
					let script = $(this);
					if (!script.attr("src")) {
						if (!script.attr("excalibur-execute")) return;
						let scriptContent = script.text().trim();
						if (scriptContent.length === 0 || scriptContent.match(/^[\s\n\r]*$/)) return;

						try {
							eval(scriptContent);
						} catch (e) {
							console.error('Error executing inline script:', e);
							console.error('Script content was:', scriptContent);
						}
					}
				});
			} catch (e) {
				console.error('Inline script execution failed:', e);
			}
		}
	},

	Mobile: {

		init: function(){
			if(!Excalibur.$view.hasClass('mobileApp') && !Excalibur.$view.hasClass('mobileLogin') && Excalibur.$view.hasClass('user')) {
				Excalibur.Mobile.Menu.download_menu();
				Excalibur.Mobile.init_events();
				//condition checks if mobile app all code BELOW the if statement is targeted for mobile apps only
				if( window.webkit && webkit.messageHandlers && webkit.messageHandlers.cordova_iab ) {
					Excalibur.Mobile.android_offline_ajax_post_fix();
					webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.enableAjax'}));
				}
			}
		},

		is_mobile_app: function(){
			if(window.webkit && webkit.messageHandlers && webkit.messageHandlers.cordova_iab)
				return true;
			return false;
		},

		init_events: function(){
			$(window).on('resize', function(){
				if(( Excalibur.$view.width() < 768  || ( Excalibur.$view.width() < 1025 && Excalibur.evo )) && !Excalibur.Mobile.Menu.started ) {
					Excalibur.Mobile.Menu.download_menu();
				}
			});
		},

		android_offline_ajax_post_fix: function(){
			$( document ).ajaxSend(function( event, jqxhr, settings ) {
				if(!navigator.onLine)
					settings.data = 'offline';
			});
		},

		offline_link_overide: function(){
			var url = this.attr('href');
			if( window.webkit && webkit.messageHandlers && webkit.messageHandlers.cordova_iab ) {
				webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'data': url, 'method': 'app.AcceleratorAPI.interceptURL'}));
				$(window).trigger('beforePageChange');
			}
			else
				Excalibur.Mobile.Router.load( url );
		},

		open_mobile_bar: function(){
			$("#user-menu").trigger( "open.mm" );
		},

		ajax_popup: function(url, title){
			url = url || this.attr('href');
			title = title || 'Popup';
			$.get( url, function(html){
				Excalibur.Mobile.popup(title, html);
			});
		},

		popup: function( title, content, callback, mini ){
			var $popup = $('<div class="popup-container '+ (mini ? 'mini' : '') +'"><div class="native-popup add-popup"><div class="nav mobileSearch"><div class="title">' + title + '</div><a href="javascript:void(0)" class="close"><i class="xCross inverted"></i><span class="textOffScreen">Close search</span></a></div><div class="content">' + (content || '') + '</div></div><div class="popup-overlay"></div></div>');
			$popup = $popup.appendTo( Excalibur.$view );
			Excalibur.$view.addClass('no-scroll');
			callback && callback( $popup );
			$(window).one('preload', function(){
				Excalibur.Mobile.close_popup($popup);
			});
			$popup.find('.close, .popup-overlay').one('click', function(){
				Excalibur.Mobile.close_popup($popup);
			});
		},

		close_popup: function($popup){
			Excalibur.$view.removeClass('no-scroll');
			$popup.find('.native-popup').removeClass('add-popup');
			setTimeout(function(){
				$popup.find('.native-popup').addClass('remove-popup');
				setTimeout(function(){
					$popup.remove();
					Excalibur.$view.find('#user-menu .header a:first-child').focus();
				}, 300);
			}, 20);
		},

		search: function(){
			if(navigator.onLine) {
				var content = '<div class="search-bar"><input type="text" placeholder="Search"><button excalibur-click="Excalibur.Mobile.search_submit"><i class="search"></i></button></div><div class="search-results first-load"></div>';
				Excalibur.Mobile.popup('Quick search', content, function ($popup) {
					$popup.find('.search-bar input').focus();
					$popup.find('.search-bar input').on('keyup', function (e) {
						if (e.keyCode === 13)
							Excalibur.Mobile.search_submit();
					});
				});
			}
			else
				alert('This feature is not available in offline mode ');
		},

		search_submit: function(){
			var popup = Excalibur.$view.find('.native-popup');
			var input = popup.find('.search-bar input');
			var data = {'phrase' : input.val(), 'router' : true};
			var container = popup.find('.search-results');
			container.removeClass('first-load');
			container.empty();
			input.blur();
			$.post('/search_simple/summary', data, function( html ){
				Excalibur.Location_tools.no_render_jobj( html, function( $file ){
					var center_content = $file.find('#centreColumn');
					// if there is a redirect
					if(center_content.length)
						window.location = '/search_simple/summary?phrase=' + data.phrase;
					else
						container.append(html);
				});
			});
		},

		help_popup: function(){
			Excalibur.Mobile.popup('Help', '', function ($popup) {
				$popup.addClass('help-popup');
					$.get( '/help', function(content){
						$popup.find('.content').append(content);
						window.tabnav_adjustment && tabnav_adjustment('.help-popup');
					});
			});
		},

		Menu: {
			init: function(){
				if( Excalibur.evo ) {
					console.log('menu init');
					Excalibur.Mobile.Menu.select_active(Excalibur.$view);
					Excalibur.Mobile.Menu.More.init();
				}
				else{
					Excalibur.Mobile.Menu.scroll_helper();
					//remove flash menu
					Excalibur.$view.find('#leftColumn .staticMainNav').remove();
				}
				// Ensure initial sync on first load
				var _menu = Excalibur.$view.find('#user-menu');
				if( _menu.length ) Excalibur.Mobile.Menu.update_for_subnav_open(_menu);
			},

			update_for_subnav_open: function( menu ){
				var contentWrap = Excalibur.$view.find('#contentWrap');
				if( menu.hasClass('subnav-open') )
					contentWrap.addClass('for_subnav_open');
				else
					contentWrap.removeClass('for_subnav_open');
			},

			evo_add_submenu: function( menu, $html ){
				var prev_selected = Excalibur.$view.find('#user-menu .sub-menu a.selected').attr('title');
				menu.find('.sub-menu').remove();
				var submenu = $html.find('#user-menu .sub-menu');
				if( submenu.length ) {
					menu.addClass('subnav-open');
					Excalibur.Mobile.Menu.update_for_subnav_open(menu);
					menu.prepend(submenu);
				}
				else{
					menu.removeClass('subnav-open');
					Excalibur.Mobile.Menu.update_for_subnav_open(menu);
				}
				Excalibur.Mobile.Menu.select_active($html);
				$html.find('#user-menu').remove();
			},

			select_active: function( $html ){
				// Select active tab
				Excalibur.Mobile.Menu.select_active_tab($html);
				// Select active sub tab
				Excalibur.Mobile.Menu.select_active_sub_tab($html);
			},

			scroll_helper: function(){
				var menu = Excalibur.$view.find('#user-menu');
				window.menu_scroll_helper && clearTimeout(window.menu_scroll_helper);
				window.menu_scroll_helper = setTimeout( function(){
					Excalibur.Mobile.Menu.main_nav = menu.find('ol:first').get(0);
					Excalibur.Mobile.Menu.$window = $(window);
					Excalibur.Mobile.Menu.window_width = Excalibur.Mobile.Menu.$window.width();
					Excalibur.Mobile.Menu.window_height = Excalibur.Mobile.Menu.$window.height();
					Excalibur.Mobile.Menu.nav_height = Excalibur.Mobile.Menu.main_nav.scrollHeight + menu.find('.header').height();
					var container = Excalibur.$view.find('#contentWrap');
					container.css('min-height', Math.max( Excalibur.Mobile.Menu.nav_height, (Excalibur.Mobile.Menu.$window.height() - 95), container.css('min-height').replace(/[^\d\.\-]/g, '') ) + 'px');
					/*
					if( Excalibur.Mobile.is_mobile_app() && Excalibur.Mobile.Menu.window_width > 750 ) {
						Excalibur.Mobile.Menu.$window = Excalibur.$view.find('#contentWrap');
						Excalibur.Mobile.Menu.scroll_elem = Excalibur.Mobile.Menu.$window.get(0);
						Excalibur.Mobile.Menu.$window.off('scroll', Excalibur.Mobile.Menu.scroll_func).on('scroll', Excalibur.Mobile.Menu.scroll_func);
					}
					 */
					Excalibur.Mobile.Menu.$window.off('resize', Excalibur.Mobile.Menu.scroll_helper).on('resize', Excalibur.Mobile.Menu.scroll_helper);
					window.menu_scroll_helper = null;
				}, 300);
			},

			scroll_func: function(){
				var scroll_top = Excalibur.Mobile.Menu.scroll_elem.scrollTop;
				if( (scroll_top + Excalibur.Mobile.Menu.window_height) < Excalibur.Mobile.Menu.nav_height ) {
					Excalibur.Mobile.Menu.main_nav.style.transform = 'translate3D(0, -' + scroll_top + 'px, 0)';
					window.scroll_timer && clearTimeout(window.scroll_timer);
					window.scroll_timer = setTimeout(function () {
						if ((Excalibur.Mobile.Menu.scroll_elem.scrollTop + Excalibur.Mobile.Menu.window_height) > Excalibur.Mobile.Menu.nav_height)
							Excalibur.Mobile.Menu.main_nav.style.transform = 'translate3D(0, -' + (Excalibur.Mobile.Menu.nav_height - Excalibur.Mobile.Menu.window_height) + 'px, 0)';
						else if (Excalibur.Mobile.Menu.scroll_elem.scrollTop == 0)
							Excalibur.Mobile.Menu.main_nav.style.transform = 'translate3D(0, 0, 0)';
					}, 80);
				}
			},

			add_shortcuts: function( menu, page ){
				menu.find('.left-bar-add').parent('li').remove();
				page = (page || Excalibur.$view);
				page.find('#leftColumn .left-bar-add').each(function(){
					var list = $('<li></li>').append( $(this) );
					list.appendTo( menu.find('ol:first') );
					list.find('a.toggleList').on('click', function(){
						setTimeout(function(){
							Excalibur.Mobile.Menu.scroll_helper();
						},100);
					});
				});
			},

			add_image: function( menu, $page ){
				var menu = menu.find('> ol:first');
				if(!menu.find('.user_logo').length)
					menu.prepend( $page.find('#leftColumn .user_logo') );
			},

			download_menu: function(){
				Excalibur.Mobile.Menu.started = true;
				var data = localStorage.getItem('mobile_nav_content') || false;
				if( (data && !window.update_nav) || (data && !navigator.onLine) )
					Excalibur.Location_tools.no_render_jobj( data, function( html ) {
						if (html.find('#wrapper').length < 1) {
							Excalibur.Mobile.Menu.menu_build(data);
						}
						else
							localStorage.removeItem('mobile_nav_content');
					});
				else if( !Excalibur.Mobile.is_mobile_app() || (Excalibur.Mobile.is_mobile_app() && navigator.onLine) )
					$.get('/navigation/main_nav_mobile', function(data){
						Excalibur.Location_tools.no_render_jobj( data, function( html ) {
							if( html.find('#wrapper').length < 1 ) {
								localStorage.setItem('mobile_nav_content', data);
								Excalibur.Mobile.Menu.menu_build(data);
							}
						});
					});
				else if( window.webkit && webkit.messageHandlers && webkit.messageHandlers.cordova_iab )
					webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify( {'method' : 'app.AcceleratorAPI.requestMenu'}));
			},

			menu_build: function(content){
				if(!Excalibur.evo) {
					initMobileMenuContent(content);
					Excalibur.Mobile.Menu.$nav = Excalibur.$view.find('#user-menu');
					Excalibur.Mobile.Menu.add_shortcuts(Excalibur.Mobile.Menu.$nav);
					if (Excalibur.$view.hasClass('nav-open'))
						Excalibur.Mobile.Menu.open();
					Excalibur.$view.find('.tabnav .tabnav__tab:first-child[excalibur-click="Excalibur.Mobile.Menu.toggle_class_type"], .tabnav .tabnav__tab:first-child [excalibur-click="Excalibur.Mobile.Menu.toggle_class_type"]').trigger('click');
					Excalibur.Mobile.Menu.init();
					if (mobile_app_mode && Excalibur.$view.hasClass('mobile-app') && Excalibur.$view.hasClass('user')) {
						webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
							'data': {
								'tablet': localStorage.getItem('left_nav_content'),
								'mobile': content
							}, 'method': 'app.AcceleratorAPI.storeMobileNav'
						}));
					}
				}
			},

			init_classes: function(){
				Excalibur.Mobile.Menu.toggle_class_type.call( this.find('.tabnav .tabnav__tab:first') );
			},

			toggle_class_type: function(){
				var container = this.closest('[excalibur-init]');
				container.find('.selected').removeClass('selected');
				this.addClass('selected');
				container.find('.scroll').addClass('hidden');
				container.find('.scroll.' + this.attr('data-type') ).removeClass('hidden');
			},

			open: function(){
				var menu = Excalibur.$view.find('#user-menu');
				if(!Excalibur.evo) {
					menu.addClass('open');
					setTimeout(function(){
						Excalibur.$view.addClass('nav-open');
					}, 5);
					setTimeout(function(){
						menu.addClass('opened').removeClass('open');
					}, 305);
				} else {
					menu.addClass('opened');
					Excalibur.$view.addClass('nav-open');
				}
				this.attr('aria-expanded', true);
				menu.find('.header a:first-child').focus();
			},

			close: function(){
				var menu = this.closest('#user-menu');
				Excalibur.$view.removeClass('nav-open');
				if(!Excalibur.evo) {
					setTimeout(function(){
						menu.removeClass('opened');
					}, 300);
				} else {
					menu.removeClass('opened');
				}

				$('.leftMobileBar').attr('aria-expanded', false).focus();
			},

			toggle_sub: function(){
				var href = this.attr('href');
				if (!Excalibur.touching() && href && href != '' && href.indexOf('javascript') < 0 && this.attr('onclick') != 'return false;' && (!this.parent().is('[excalibur-mouseover]') || ((Excalibur.$view.width() > 767) || Excalibur.$view.width() > 1025))) {
					Excalibur.Mobile.Router.load( this.attr('href') );
				} else {
					var list_item = this.parent();
					if (list_item.find('> .ajaxDropdown').length)
						Excalibur.Mobile.Menu.ajax_dropdown.call(this.parent());
					var has_open = list_item.hasClass('mm-opened');

					var dropdown = list_item.find('.dropDown');

					list_item.parent().find('.mm-opened').removeClass('mm-opened');
					list_item.closest('ol').removeClass('sub-open');
					if (!has_open) {
						list_item.addClass('mm-opened');
						list_item.closest('ol').addClass('sub-open');
						if ((Excalibur.$view.width() > 767 && !Excalibur.evo) || Excalibur.$view.width() > 1025) {
							clearTimeout(Excalibur.Mobile.Menu.sub_position_timer);
							Excalibur.Mobile.Menu.sub_position_timer = setTimeout(function () {
								Excalibur.Mobile.Menu.position_dropdown(dropdown, list_item);
							}, 65);
						}
					}
					var selectables = $(':focusable', list_item);
					var currentIndex = selectables.index($(':focus'));
					selectables.eq(currentIndex + 1).focus();

					if ((Excalibur.$view.width() <= 767 && !Excalibur.evo) || Excalibur.$view.width() <= 1025) {
						var position = (document.dir == 'rtl') ? 'right' : 'left';
						var menu_scroll_left = $('#user-menu > ol').scrollLeft();

						if ($('#user-menu > ol').hasClass('sub-open') && !Excalibur.evo) {
							this.css(position, menu_scroll_left + 'px');
							dropdown.css(position, menu_scroll_left + 'px');
						} else {
							this.css(position, menu_scroll_left);
							dropdown.css(position, menu_scroll_left);
						}
					}
				}
			},

			open_sub: function(e){
				if((Excalibur.$view.width() > 767 && !Excalibur.evo) || Excalibur.$view.width() > 1025) {
					var $elem = this;
					clearTimeout(Excalibur.Mobile.Menu.sub_open_timer);
					clearTimeout(Excalibur.Mobile.Menu.sub_close_timer);
					Excalibur.Mobile.Menu.sub_close_timer = null;
					Excalibur.Mobile.Menu.sub_open_timer = setTimeout(function () {
						var dropdown = $elem.find('.dropDown');
						if (!$elem.hasClass('mm-opened') && dropdown.length) {
							if ($elem.find('> .ajaxDropdown').length)
								Excalibur.Mobile.Menu.ajax_dropdown.call($elem);
							$elem.closest('ol').find('.mm-opened').removeClass('mm-opened');
							$elem.closest('ol').addClass('sub-open');
							$elem.addClass('mm-opened');
							Excalibur.Mobile.Menu.position_dropdown(dropdown);
						}
						else if(!$elem.hasClass('mm-opened'))
							$elem.closest('ol').find('.mm-opened').removeClass('mm-opened');
					}, 65);
				}
			},

			position_dropdown: function(dropdown, container) {
				dropdown.css('top', '-10px');

				var dropdown_offset = dropdown.innerHeight() + (container || dropdown).offset().top;
				var window_offset = window.innerHeight + $(window).scrollTop();

				if ((dropdown_offset > window_offset)) {
					dropdown.css('top', '-' + (dropdown_offset - window_offset) + 'px');
				}

				if (Excalibur.evo && $('ol.mobileSubMenu').has(dropdown).length) {
					let dropdown_position = dropdown.parent().offset().top - $(window).scrollTop();
					// limit for stopping the dropdown from going out off screen
					let limit = window.innerHeight - dropdown.innerHeight();

					dropdown.css('top', Math.min(dropdown_position, limit) + 'px');

					$('ol.mobileSubMenu div.scroll-wrapper').scroll(function() {
						// Math.max for not letting the dropdown go higher than the top side of the sidebar
						let scrolled_position = Math.max(80, dropdown.parent().offset().top - $(window).scrollTop());

						if (scrolled_position < window.innerHeight) {
							dropdown.css('top', Math.min(scrolled_position, limit) + 'px');
						}
					});
				}
			},

			close_sub: function(e){
				if((Excalibur.$view.width() > 767 && !Excalibur.evo) || Excalibur.$view.width() > 1025) {
					var $elem = this;
					Excalibur.Mobile.Menu.sub_close_timer = setTimeout(function () {
						$elem.removeClass('mm-opened');
						Excalibur.Mobile.Menu.sub_close_timer = null;
						$elem.closest('ol').removeClass('sub-open');
					}, 70);
				}
			},

			close_tab_sub: function(e){
				var $elem = $('.mm-opened');
				var link = $('.mm-opened').children()[0];
				Excalibur.Mobile.Menu.sub_close_timer = setTimeout(function () {
					$elem.removeClass('mm-opened');
					Excalibur.Mobile.Menu.sub_close_timer = null;
				}, 70);
				link.focus();
			},

			add_submenu: function( $page, ajax_loading ){
				if(!Excalibur.evo) {
					var menu = Excalibur.$view.find('#user-menu');
					var active_sub_menu = menu.find('.sub-menu');
					var container = $('<div class="sub-menu active"></div>');
					menu.find('.selected').removeClass('selected');
					Excalibur.$view.find('.tabnav .tabnav__tab:first-child[excalibur-click="Excalibur.Mobile.Menu.toggle_class_type"], .tabnav .tabnav__tab:first-child [excalibur-click="Excalibur.Mobile.Menu.toggle_class_type"]').trigger('click');
					if ($page.find('ol.mobileSubMenu').length) {
						//$(window).off('scroll', Excalibur.Mobile.Menu.scroll_func);
						clearTimeout(window.scroll_timer);
						menu.find('ol').attr('style', 'transition: none;translate3d(-100%, 0px, 0px);');
						var sub_menu = $page.find('ol.mobileSubMenu').clone().appendTo(container);
						if (active_sub_menu.length)
							active_sub_menu.remove();
						else
							Excalibur.$view.find('#user-menu .header').prepend('<a href="javascript:void(0)" class="hide-sub" excalibur-click="Excalibur.Mobile.Menu.hide_sub" excalibur-mouseout="Excalibur.Mobile.Menu.show_sub" excalibur-mouseover="Excalibur.Mobile.Menu.hide_sub"><span><i class="home inverted"></i><span class="textOffScreen">Home</span></span></a>');
						container.find('ol > li > a + ul, ol > li > a + .dropDown').prev().attr('excalibur-click', 'Excalibur.Mobile.Menu.toggle_sub').append('<i class="arrowRight"></i>').closest('li').attr('excalibur-mouseout', 'Excalibur.Mobile.Menu.close_sub').attr('excalibur-mouseover', 'Excalibur.Mobile.Menu.open_sub');
						container.prependTo(Excalibur.$view.find('#user-menu'));
						setTimeout(function () {
							menu.find('.sub-menu ~ ol').removeAttr('style');
						}, 150);
						menu.addClass('subnav-open');
						Excalibur.Mobile.Menu.update_for_subnav_open(menu);
					} else {
						if (active_sub_menu.length) {
							active_sub_menu.parent().find('.show-sub, .hide-sub').remove();
							active_sub_menu.remove();
							menu.removeClass('subnav-open');
							Excalibur.Mobile.Menu.update_for_subnav_open(menu);
						}
						menu.find('a:not([aria-haspopup]):not(.floatR)[href="/' + Excalibur.Location_tools.get_rel_path(location.href).split('?')[0] + '"]').last().closest('ol > li').find('>a:first').addClass('selected');
						Excalibur.Mobile.Menu.add_image(menu, $page);
					}
					container.parent().find('> ol').attr('excalibur-mouseout', 'Excalibur.Mobile.Menu.show_sub').attr('excalibur-mouseover', 'Excalibur.Mobile.Menu.hide_sub');
					if ($page.find('.zero-bar').length)
						Excalibur.$view.find('#user-menu').addClass('zero-bar');
					else
						Excalibur.$view.find('#user-menu').removeClass('zero-bar');
					document.documentElement.scrollTop = 0;
					if (ajax_loading) {
						//Excalibur.$view.find('#contentWrap').css('min-height', '');
						Excalibur.Mobile.Menu.init();
					}
				}
			},

			hide_sub: function(e){
				if( !e || ((Excalibur.$view.width() > 767 && !Excalibur.evo) || Excalibur.$view.width() > 1025) ) {
					Excalibur.Mobile.Menu.sub_menu_timer && clearTimeout(Excalibur.Mobile.Menu.sub_menu_timer);
					var menu = Excalibur.$view.find('#user-menu');
					menu.find('.header .hide-sub').replaceWith('<a href="javascript:void(0)" class="show-sub" excalibur-mouseout="Excalibur.Mobile.Menu.show_sub" excalibur-mouseover="Excalibur.Mobile.Menu.hide_sub" excalibur-click="Excalibur.Mobile.Menu.show_sub"><span><i class="arrowLeft inverted"></i><span class="textOffScreen">Back</span></span></a>');
					menu.find('.sub-menu').removeClass('active');
					menu.find('.mm-opened').removeClass('mm-opened');
				}
			},

			show_sub: function(e){
				if( !e || ((Excalibur.$view.width() > 767 && !Excalibur.evo) || Excalibur.$view.width() > 1025) ) {
					Excalibur.Mobile.Menu.sub_menu_timer = setTimeout(function () {
						Excalibur.Mobile.Menu.sub_menu_timer = null;
						var menu = Excalibur.$view.find('#user-menu');
						menu.find('.header .show-sub').replaceWith('<a href="javascript:void(0)" class="hide-sub" excalibur-mouseout="Excalibur.Mobile.Menu.show_sub" excalibur-mouseover="Excalibur.Mobile.Menu.hide_sub" excalibur-click="Excalibur.Mobile.Menu.hide_sub"><span><i class="home inverted"></i><span class="textOffScreen">Home</span></span></a>');
						menu.find('.sub-menu').addClass('active');
						menu.find('.mm-opened').removeClass('mm-opened');
						menu.find('.sub-open').removeClass('sub-open');
					}, 70);
				}
			},

			ajax_dropdown: function(){
				var $this = this.find('.ajaxDropdown:first');
				if ($this.siblings('.dropDown').html().length == 0) {
					$.get($this.attr('href') + '?popout=true&from=' + encodeURIComponent(window.location.href), function (data) {
						$this.siblings('.dropDown').html(data);
						if (Excalibur.evo) {
							Excalibur.Mobile.Menu.position_dropdown($this.siblings('.dropDown'));
						}
					});
				}
			},

			select_active_tab: function( $html ) {
				// Get selected tab title
				const selected_tab_title = $html.find('#user-menu').data('activeTabTitle');

				// Check if selected tab is present
				if ( selected_tab_title ) {
					// Update the page with the latest data attribute
					Excalibur.$view.find('#user-menu').data('activeTabTitle', selected_tab_title);
					// Remove previously selected tab
					Excalibur.$view.find('#user-menu > ol li > a.selected:not(div.dropDown li > a.selected)').removeClass('selected');
					// Highlight the newly selected tab
					Excalibur.$view.find('#user-menu > ol li > a[title="' + selected_tab_title + '"]').addClass('selected');
				}
			},

			select_active_sub_tab: function( $html ) {
				// Get selected sub tab title
				const selected_sub_tab_title = $html.find('#user-menu').data('activeSubTabTitle');

				// Check if selected sub tab is present
				if ( selected_sub_tab_title ) {
					// Update the page with the latest data attribute
					Excalibur.$view.find('#user-menu').data('activeSubTabTitle', selected_sub_tab_title);
					// Remove previously selected sub tab
					Excalibur.$view.find('#user-menu ol.mobileSubMenu li > a.selected').removeClass('selected');
					// Highlight the newly selected tab
					Excalibur.$view.find('#user-menu ol.mobileSubMenu li > a[title="' + selected_sub_tab_title + '"]').addClass('selected');
					// Scroll to the selected sub tab
					const selected = document.querySelector('ol.mobileSubMenu .selected');
					const container = document.querySelector('ol.mobileSubMenu .scroll-wrapper');
					if (selected && container) {
						if (selected.getBoundingClientRect().bottom < container.getBoundingClientRect().top || selected.getBoundingClientRect().top > container.clientHeight) {
							container.scrollTo(0, selected.getBoundingClientRect().top - container.getBoundingClientRect().top);
						}
					}
				}
			},

			More: {
				init: function(){
					if( !Excalibur.Mobile.Menu.More.loaded )
						Excalibur.Mobile.Menu.More.init_events();
					Excalibur.Mobile.Menu.More.main_menu = Excalibur.$view.find('#user-menu > ol:first');
					Excalibur.Mobile.Menu.More.more = Excalibur.$view.find('#user-menu > ol li.more');
					Excalibur.Mobile.Menu.More.offset = Excalibur.Mobile.Menu.More.main_menu.find('.fixed-bottom').height() + 150;
					if(Excalibur.Mobile.Menu.More.main_menu.find('.nav-image').length)
						Excalibur.Mobile.Menu.More.offset += Excalibur.Mobile.Menu.More.main_menu.find('.nav-image').height();

					Excalibur.Mobile.Menu.More.eval( Excalibur.Mobile.Menu.More.main_menu, Excalibur.Mobile.Menu.More.offset, Excalibur.Mobile.Menu.More.more);
					Excalibur.Mobile.Menu.More.loaded = true;
				},

				init_events: function(){
					$(window).on('resize', function(e){
						Excalibur.Hit_manager.delay_process( 500, function(){
							Excalibur.Mobile.Menu.More.eval( Excalibur.Mobile.Menu.More.main_menu, Excalibur.Mobile.Menu.More.offset, Excalibur.Mobile.Menu.More.more);
						});
					});
				},

				eval: function( menu, offset, more ){
					var list_item = menu.find(' > li:not(.more):not(.mobile-only)');
					var remainder = Math.round(( (list_item.length * 50) - (window.innerHeight - offset) ) / 50 );
					var list = more.find('> ol');
					if( remainder > 0 && window.matchMedia("(min-width: 1025px)").matches) {
						var list = more.find('> ol');
						more.addClass('vis');
						for (var i = 1; i < (remainder + 1); i++) {
							list.append( list_item.get( list_item.length - i ) );
						}
						more.find('li > a.selected').length && more.addClass('active');
					}
					else if( remainder < 0 ){
						remainder = Math.abs(remainder);
						for (var i = 1; i < (remainder + 1); i++) {
							list.find(' > li:last').insertAfter( list_item.last() );
						}
						if(list.is(':empty'))
							more.removeClass('vis').removeClass('active');
						//Excalibur.Mobile.Menu.More.eval( menu, offset, more);
					}
				},

				toggle_active: function(){
					var list_item = this.closest('li');
					if( list_item.parent().is('.fixed-bottom') )
						list_item.parent().toggleClass('active');
					list_item.toggleClass('active');
				}
			}
		},

		Router: {
			load: function( url, target_div, is_back, callback_func ){
				target_div = target_div || '#contentWrap';
				url = url || this.attr('href');
				if( !navigator.onLine ) { location.href = url; return; }
				!Excalibur.Router.router_mode && Excalibur.Router.init();
				$.facebox && $.facebox.close();
				Excalibur.animation_complete = Excalibur.html_loaded = false;
				var loading_div = Excalibur.$view.find( target_div );
				if( url.indexOf('router') > -1 ) {
					if (url.indexOf('from=') > -1)
						url = url.replace('Frouter', 'Fblank_param');
					else
						url = url.replace(/(\&|\?)router=true/, '');
				}
				var ajaxUrl = url + Excalibur.Location_tools.url_extender(url) + 'page_router=true';
				console.log( ajaxUrl, url);
				//remove line under later when cart is reworked, redirect if cart or leaving cart....
				var content = (loading_div.find('#mainContent').length ? loading_div.find('#mainContent') : loading_div.find('#centreColumn'));
				var animate_direction = window.transitionDirection ? 'animate-' + window.transitionDirection : 'animate-left';
				window.transitionDirection = null;
				var temp_page = $('<div class="' + animate_direction + ' temp-page"></div>').insertBefore( content );
				var loading_animation = setTimeout(function(){
					Excalibur.animation_complete = true;
					Excalibur.Mobile.Router.unwrap_content(temp_page);
				}, (Excalibur.Mobile.is_mobile_app() ? 400 : 2));
				Excalibur.Location_tools.add_load_indicator( temp_page, (Excalibur.Mobile.is_mobile_app() ? 400 : 1000) );
				Excalibur.Mobile.Menu.show_sub();

				$(window).trigger('beforexload', {'current_url' : location.href, 'new_url' : url, 'target_div': target_div});
				$.get( ajaxUrl, function( html ){
					var dom_container = $('<div></div>').append( html );
					if( dom_container.find(target_div).length && Excalibur.Router.bypass_check(html, dom_container, target_div) ) {
						window.run_on_ready_functions = false;
						Excalibur.Router.clean_resources();
						!is_back && history.pushState(JSON.stringify({
							url: url,
							target_div: target_div,
							callback_func: callback_func,
							full_page: true
						}), null, url);
						window.is_first = null;
						$(window).scrollTop(0);
						target_div = Excalibur.Mobile.Router.replace_html(html, target_div, url, temp_page, dom_container);
						Excalibur.html_loaded = true;
						Excalibur.Mobile.Router.unwrap_content(temp_page);
						const afterHighcharts = Excalibur.Router._highchartsReady || $.Deferred().resolve().promise();
						Excalibur.Router._highchartsReady = null;
						afterHighcharts.then(function(){
							Excalibur.Location_tools.execute_inline_scripts(html);
							$(window).trigger('loadcomplete');
							window.initializeTabNavsAndSelectFirst && window.initializeTabNavsAndSelectFirst();
							setTimeout(function(){
								Excalibur.run_on_ready();
							},180);
						});
						Excalibur.Router.current_state = history.state;
						if( Excalibur.Mobile.is_mobile_app() ) {
							loading_div.scrollTop(0);
							webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.afterAjaxPageLoad'}));
							if (navigator.onLine) {
								var params = html.match(/mobile_cache_page\((.*?)\)/);
								var decoded_params = (params && params[1]) ? params[1].split(',') : null;
								params && window.mobile_cache_page(decoded_params[0], decoded_params[1]);
							}
						}
						else
							Excalibur.Mobile.Router.desktop_handle();
						navigator && !navigator.onLine && $('body').addClass('offline-mode');
					}
					else {
						Excalibur.Mobile.is_mobile_app() && webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.setBypassAjax'}));
						location.href = url;
						temp_page.remove();
					}
				}).fail(function(e) {
					if(e.status == 0 && url.indexOf('http://') > -1)
						Excalibur.Mobile.Router.load( url.replace('http://', 'https://') );
					else if( e.status == 0 && !navigator.onLine ) {
						location.href = url;
					}
					else if( e.status == 0 && navigator.onLine ) {
						if( Excalibur.Mobile.is_mobile_app() && location.host.indexOf('127.0.0.1') == -1 )
							window.open(url);
						else {
							Excalibur.Mobile.is_mobile_app() && webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.setBypassAjax'}));
							location.href = url;
						}
					}
					window.loading_animation && clearTimeout( loading_animation );
					temp_page.remove();
				});
				Excalibur.Mobile.Menu.close.call($('#user-menu > div'));
			},

			replace_html: function( html, target_div, url, temp_page, temp ){
				Excalibur.Mobile.Menu.add_submenu( temp, true );
				Excalibur.evo && Excalibur.Mobile.Menu.evo_add_submenu( Excalibur.$view.find('#user-menu'), temp);
				!Excalibur.evo && Excalibur.Mobile.Menu.add_shortcuts( Excalibur.Mobile.Menu.$nav, temp );
				$(window).trigger('preload', {'html' : html, 'url' : url, 'obj': temp, 'full_page': true});
				var container = temp_page || Excalibur.$view.find( target_div );
				html = temp.find(target_div)[0].innerHTML;
				temp_page.append(html);
				temp_page.find('#chatContainer').remove();
				// ^removing chat container since we do not delete it on page loads.
				temp_page.find('#leftColumn .staticMainNav').remove();
				setTimeout(function(){
					window.add_mobile_heading && window.add_mobile_heading(Excalibur.$view.find('.sectionTitle h1').text(), '');
				},300);
				temp_page.find('.rightColumn:not(.resizable)').length ? Excalibur.$view.find('#contentWrap').addClass('hasRightColumn') :  Excalibur.$view.find('#contentWrap').removeClass('hasRightColumn');

				updatePageTitle();

				return target_div;
			},

			unwrap_content: function( container ){
				if( Excalibur.html_loaded && (Excalibur.animation_complete || !Excalibur.Mobile.is_mobile_app()) ) {
					container.parent().find('> *:not(.temp-page):not(#chatContainer):not(#aiWindowContainer)').remove();
					container.find('.custom-loader').remove();
					var content = (container.find('#mainContent').length ? container.find('#mainContent') : container.find('#centreColumn'));
					content.unwrap();
				}
			},

			desktop_handle: function(){
				Excalibur.$view.find('.quickLinks .highlight').removeClass('highlight');
			}

		}
	},

	File_explorer: {
		slider_dom: '<div class="swiper image-swiper"><div class="swiper-wrapper"><div class="swiper-slide"><div class="swiper-zoom-container"><img/></div></div></div><div class="swiper-button-next"></div><div class="swiper-button-prev"></div></div>',
		right_column: '<div class="right-column"><div class="container rightColumn"></div></div>',

		search: function(){
			var target_div = this.attr('to-replace');
			Excalibur.Hit_manager.simple_hit( Excalibur.File_explorer.update_libraries( this.attr('search-location'), this ), {}, 500, target_div);
		},

		tile_click: function(){
			var url = this.attr('href');
			if( url.indexOf('.') > -1 )
				if( this.hasClass('picture') )
					Excalibur.File_explorer.image_open([url], this);
				else if( this.hasClass('video') )
					Excalibur.File_explorer.video_open( url, this );
				else if( this.hasClass('audio/podcast') )
					Excalibur.File_explorer.audio_open( url, this );
				else if( this.hasClass('pdf')  )
					Excalibur.File_explorer.file_open( this.attr('url'), this );
				else if ( this.hasClass('document') || this.hasClass('powerpoint') )
					Excalibur.File_explorer.file_open( url, this );
				else
					window.open(url);
			else
				if( this.hasClass('pdf') )
					Excalibur.File_explorer.file_open( this.attr('url'), this );
				else if ( this.hasClass('document') || this.hasClass('powerpoint') )
					Excalibur.File_explorer.file_open( url, this );
				else
					window.open(url);


		},

		audio_open: function( url, right_column ){
			Excalibur.Mobile.popup( 'Audio', '', function($popup){
				if( right_column ) {
					$popup.find('.content').addClass('two-columns');
					Excalibur.File_explorer.add_column( $popup.find('.content'), right_column, true );
				}
			});
		},

		image_open: function( urls, right_column ){
			Excalibur.ie_support('/javascripts/plugins/swiper-bundle.min.js', '/javascripts/plugins/swiper.jquery.min.js', function() {
				Excalibur.Location_tools.css_load('/stylesheets/plugins/swiper-bundle.min.css', true);
				Excalibur.Mobile.popup( 'Image', Excalibur.File_explorer.slider_dom, function($popup){
					if( right_column ) {
						$popup.find('.content').addClass('two-columns');
						Excalibur.File_explorer.add_column( $popup.find('.content'), right_column );
					}
					var container = $popup.find('.swiper-wrapper');
					var temp = container.find('.swiper-slide:first');
					$.each( urls, function(){
						var slide = temp.clone().appendTo( container );
						slide.find('img').attr('src', this);
					});
					temp.remove();
					var swiper = new Swiper(".native-popup .image-swiper", {
						zoom: true,
						navigation: {
							nextEl: ".swiper-button-next",
							prevEl: ".swiper-button-prev",
						},
					});
				});
			});
		},

		video_open: function( url, right_column ){
			Excalibur.Mobile.popup( 'Video', '', function($popup){
				if( right_column ) {
					$popup.find('.content').addClass('two-columns');
					Excalibur.File_explorer.add_column( $popup.find('.content'), right_column, true );
				}
			});
		},

		// this is used to open a general file popup.
		file_open: function( url, right_column) {
			Excalibur.Mobile.popup('File', '', function ($popup) {
				if (right_column) {
					$popup.find('.content').addClass('two-columns');
					Excalibur.File_explorer.add_column($popup.find('.content'), right_column, true);
				}
			});
		},

		add_column: function(container, tile, resource){
			var column = ( resource ? container : $(Excalibur.File_explorer.right_column).appendTo( container ).find('.container') );
			$.post('/library/load_metadata_widget', { material_id: tile.attr('material_id'), material_type: tile.attr('material_type'), web_resource: resource }, function( html ){
					column.append(html);
			});
		},

		type_dropdown: function(){
			this.find('.dropDown').toggleClass('hidden');
			if( !this.find('.dropDown').hasClass('hidden') )
				Excalibur.any_click( null, this, Excalibur.File_explorer.type_dropdown);
			else
				Excalibur.$view.off('click', Excalibur.any_click_function);
		},

		type_filter: function(){
			var search = this.closest('.explorer-head').find('.search-bar > input');
			var target_div = '.file-explorer';
			Excalibur.File_explorer.select_tab(this);
			var type = this.attr('type');
			var filter_type = this.is('li') ? '&classification=' : '&format=';
			var url = (Excalibur.File_explorer.update_libraries( search.attr('search-location'), search ));
			Excalibur.Router.load(url, target_div, null);
		},

		toggle_list_view: function(){
			this.closest('.file-explorer').toggleClass('list-view');
			Excalibur.File_explorer.override_view_type = this.closest('.file-explorer').hasClass('list-view') ? 'list-view' : 'block-view';
		},

		select_tab: function( $elem ){
			var filter_bar = $elem.closest('.type-filter-bar');
			filter_bar.find('.selected').removeClass('selected');
			$elem.addClass('selected');
			filter_bar.find('.temp').remove();
			if( $elem.is('li') )
				$elem.clone().addClass('temp').insertBefore( filter_bar.find('> div:last') );
		},

		update_libraries: function( url, name ) {
			if( url.indexOf('?') < 0)
				url += '?from_form=true';
			url = window.update_libraries(url, true);
			return url;
		},

	},

	Clipboard: {
		dom: '<a class="clip-board" excalibur-click="Excalibur.Clipboard.toggle_open"> <span class="newAlert">1</span> <i class="clipboard"></i> <ul class="clip-list dropDown"> <div class="cta"><div class="floatR" excalibur-click="Excalibur.Clipboard.clear"> <i class="xCross"></i>Clear</div> </div> </ul></a>',
		fake_tile: '<li class="file-tile picture" url="" excalibur-click="Excalibur.facebox" href="" material_type="" material_id=""><div class="image" style="background-image:url()"></div><div class="copy" excalibur-click="Excalibur.Clipboard.add_item"><i class="copy"></i></div><div class="tile-content"><div class="file-name"></div></div></li>',

		init: function(){
			Excalibur.Clipboard.quickLinks = Excalibur.$view.find('.quickLinks');
			var clip_list = localStorage.getItem('clip_list');
			if( clip_list ){
				Excalibur.Clipboard.quickLinks.prepend(clip_list);
				Excalibur.Clipboard.quickLinks.find('.clip-board').removeClass('open');
			}

			// Check if clipboard is in an active tab and show the clip-list
			Excalibur.Clipboard.checkTabDisplay();
			Excalibur.Clipboard.setupTabListener();
		},

		setupTabListener: function(){
			// Listen for clicks on the clipboard tab
			$(document).on('click', '#tab4[rel="tab_clipboard"]', function(){
				setTimeout(function(){
					Excalibur.Clipboard.checkTabDisplay();
				}, 100);

        // this removes the extra clipboard icon and counter from the popup
				if($('#tab_clipboard').length){
          // Remove clipboard icon and counter only inside the clipboard tab popup
          $('#tab_clipboard .clipboard').remove();
          $('#tab_clipboard .new-alert, #tab_clipboard .newAlert').remove();

        }

			});
		},

		checkTabDisplay: function(){

			 //  this is to check if clipboard tab is active and show the clip-list
			const activeClipboardTab = $('#tab_clipboard.active-tab');
			if( activeClipboardTab.length ){
				const clipList = activeClipboardTab.find('.clip-list.dropDown');
				if( clipList.length ){
					// Use native DOM method to set !important styles
					clipList[0].style.setProperty('display', 'block', 'important');
					clipList[0].style.setProperty('position', 'static', 'important');

					// Ensure tiles are not selected by default
					clipList.find('.file-tile').removeClass('selected');
				}
			}
		},


		add_item: function( item ){
			if( this.closest('a').is('.r-catalog-tile') ){
				var a_tile = this.closest('a');
				var tile = $(Excalibur.Clipboard.fake_tile);
				tile.attr('material_type', this.closest('a').attr('material_type')).attr('material_id', this.closest('a').attr('material_id')).attr('url', this.closest('a').attr('href')).attr('href', this.closest('a').attr('href'));
				tile.find('.image').attr('style', a_tile.find('.imgCrop').attr('style'));
				tile.find('.file-name').text( a_tile.find('.header .class_name').text());
			}
			else {
				// Handle list view where copy icon is not inside <a> tag
				var container = this.closest('.table_flex_content');
				var a_tile = container.find('a');
				var tile = $(Excalibur.Clipboard.fake_tile);

				// Set attributes from the link
				tile.attr('material_type', a_tile.attr('material_type'))
					.attr('material_id', a_tile.attr('material_id'))
					.attr('url', a_tile.attr('href'))
					.attr('href', a_tile.attr('href'));

				// Get the image from list view (it's an <img> tag, not background-image)
				var img = container.find('img');
				if (img.length) {
					tile.find('.image').attr('style', 'background-image:url(' + img.attr('src') + ')');
				}

				// Get file name from link text
				tile.find('.file-name').text(a_tile.text().trim());
			}
			tile.find('.file-creator, .file-details').remove();
			tile.append('<div class="remove" excalibur-click="Excalibur.Clipboard.remove_item"><i class="xCross"></i></div>');
			if (Excalibur.Clipboard.quickLinks.find('.clip-board').length) {
				if (Excalibur.Clipboard.quickLinks.find('.clip-board .file-tile[material_id="' + tile.attr('material_id') + '"]').length < 1)
					Excalibur.Clipboard.quickLinks.find('.clip-board > ul').prepend(tile);
			} else {
				var elem = $(Excalibur.Clipboard.dom).prependTo(Excalibur.Clipboard.quickLinks);
				elem.find('.clip-list').prepend(tile);
			}
			var alert = Excalibur.Clipboard.quickLinks.find('.clip-board .newAlert');
			alert.addClass('new-alert');
			setTimeout(function () {
				alert.removeClass('new-alert');
			}, 310);
			alert.text(Excalibur.Clipboard.quickLinks.find('.clip-board > ul > li').length);
			localStorage.setItem('clip_list', Excalibur.Clipboard.quickLinks.find('.clip-board')[0].outerHTML);

			// Check tab display after adding item
			Excalibur.Clipboard.checkTabDisplay();
		},

		remove_item: function(){
			this.closest('li').remove();
			Excalibur.Clipboard.quickLinks.find('.clip-board .newAlert').text( Excalibur.Clipboard.quickLinks.find('.clip-board > ul > li').length );
			if( Excalibur.Clipboard.quickLinks.find('.clip-list li').length < 1 ){
				localStorage.removeItem('clip_list');
				Excalibur.Clipboard.quickLinks.find('.clip-board').remove();
			}
		},

		toggle_open: function(){
			this.toggleClass('open');
			if( this.hasClass('open') )
				Excalibur.any_click(this, this, Excalibur.Clipboard.toggle_open);
			else
				Excalibur.$view.off('click', Excalibur.any_click_function);
		},

		check_clipboard: function( container, tab ){
			var clipboard = Excalibur.Clipboard.quickLinks.find('.clip-board');
			if( clipboard.length ){
				if( tab ) {
					clipboard.clone().prependTo(container);
					container.find('.cta').remove();
					container.find('.file-tile').attr('excalibur-click', 'Excalibur.Clipboard.select_tile');
					tab.removeClass('hidden').find('a').click();
				}
				else {
					Excalibur.$view.find('#clip-board-tag').removeClass('hidden');
				}
			}
		},

		select_tile: function(){
			if( this.hasClass('selected') )
				this.removeClass('selected');
			else
				this.addClass('selected');
		},

		submit_clip: function( url ){
			url = url || this.attr('href');

			const container = this.closest('.popup, .modal__container');  // to work with both legacy and new UI popups

			const tiles = container.find('.file-tile.selected');
			const data = new FormData();

			tiles.each(function(){
				const tile = $(this);
				data.append('materials[]', (tile.attr('material_id') + ',' + tile.attr('material_type')) );
			});
			$.ajax({
				type: "POST",
				url: url,
				data: data,
				processData: false,
				enctype: 'multipart/form-data',
				contentType: false,
				success: function(){
					$.facebox.close();
					Excalibur.Router.load(location.href);
				}
			});
		},

		paste_all: function(){
			this.closest('#tab_clipboard').find('.file-tile').addClass('selected');
			Excalibur.Clipboard.submit_clip.call(this);
		},

		clear: function(){
			localStorage.removeItem('clip_list');
			Excalibur.Clipboard.quickLinks.find('.clip-board').remove();
		}
	},

	Ai: {
		init: function(){
			Excalibur.Ai.check_url();
			Excalibur.Ai.init_events();
		},

		init_events: function(){
			$(window).on('loadcomplete', function() {
				Excalibur.Ai.check_url();
			});
		},

		check_url: function( url, bypass ){
			url = url || location.href;
			var task = url.match(/#copilot_(.*)/);
			if( task && task[1] ){
				Excalibur.Drawer.open(null, function( drawer ){
					var drawer_item = drawer.find('[type=' + task[1] + ']'); // CreateClassCopilot
					drawer_item.addClass('selected');

					setTimeout( function(){
						drawer_item.removeClass('selected');

						if (bypass) {
							var url_object = new URL(url);
							var url_parts = url_object.pathname.split('/');
							var original_action = url_parts[2];
							url_parts[2] = 'new_task';
							url_object.pathname = url_parts.join('/');
							var new_url = url_object.toString();
							url = new_url.split('#')[0];
							url += (url.indexOf('?') === -1 ? '?' : '&') + "task=" + encodeURIComponent(task[1]) + "&original_action=" + encodeURIComponent(original_action);
							drawer_item.attr('url', url );
							//temp fix for change needed on backend
						}
						Excalibur.Ai.load_content.call(drawer_item, bypass);
					}, 1000);
				});
			}
			else
				return false;
		},

		load_content: function(bypass) {
			var $elem = this;
			var alt_action = $elem.attr('alt-action') || '';
			var drawer = Excalibur.$view.find('.right-drawer');

			// Close drawer if it's already open
			if (drawer.hasClass('fat-open')) {
				Excalibur.Drawer.close_fdrawer(drawer);
			}

			if (!bypass && alt_action.length > 0) {
                Excalibur.facebox({ ajax : alt_action });
            } else {
                Excalibur.Drawer.open_fdrawer.call($elem);
            }
		},

		launch_learn_ai: function() {
			console.log('launch_learn_ai');

			var form = this.parents('form');
			var selectedValues = form.find("input[name='select[]']:checked").map(function() {
				return $(this).val();
			}).get();

			if (selectedValues.length == 0) {
				$.alert({ content : 'You need to select first!' });
				return false;
			}

			var queryString = selectedValues.map(function(val) {
				return 'competencies[]=' + encodeURIComponent(val);
			}).join('&');

			// clean the url for remaining competencies[]
			let original_url = this.attr('url');
			let absolute_url = original_url.startsWith("http") ? original_url : window.location.origin + original_url;
			let url_object = new URL(absolute_url);
			let params = new URLSearchParams(url_object.search);
			params.delete("competencies[]");
			url_object.search = params.toString();
			let cleaned_url = url_object.toString();

			this.attr('url', cleaned_url + '&' + queryString);

			Excalibur.Drawer.open_fdrawer.call(this);
		},

		ask_ai: function() {
			Excalibur.open_fdrawer('Ask Ai', '', this.closest('.right-drawer'));
		},

		submit: function(id) {
			$('#' + id).submit(function() {
				var $form = $(this);
				var drawer = Excalibur.$view.find('.right-drawer');
				var drawer_content = drawer.find('.fat-drawer .content');
				var complete_page = drawer_content.find('#complete-page').html();
				var backup = drawer_content.html();
				drawer_content.empty();
				drawer_content.append( complete_page );
				drawer.addClass('complete');
				$form.ajaxSubmit({
					success: function(data) {
						setTimeout(function (){
							console.log('end', data);
							Excalibur.Drawer.close_fdrawer( drawer );
							Excalibur.Drawer.close(drawer);
							drawer.removeClass('complete');
							if( data && data.url )
								Excalibur.Mobile.Router.load(data.url);
						},2000);
					},
					error: function(){
						drawer_content.empty();
						drawer_content.append(backup);
						drawer_content.addClass('fail');
						setTimeout(function (){
							drawer_content.removeClass('fail');
							drawer.removeClass('complete');
						},2000);
					}
				});
				return false;
			});
		},

		start_confirm: function(){
			var confirm = this.closest('.content').find('.confirm-overlay');
			confirm.addClass('active');
			var form = confirm.closest('form');
			var url = form.attr('action').replace('run_copilot', 'confirm_copilot');

			$.post( url, form.serialize(), function(html){
				Excalibur.Location_tools.no_render_jobj(html, function ($html) {
					if( $html.find('#wrapper').length )
						console.log('fail ', $html);
					else {
						confirm.replaceWith($html.html());
					}
				});
			});
		},

		cancel_confirm: function(){
			this.closest('.confirm-overlay').removeClass('active');
		},

		help: function(){
			hc_go_to_topic('/help/instructors?topic=teacher_copilot');
		},

		translations: function(options) {
			Excalibur.Ai.alert_message_enter_description = options.alert_message_enter_description;
			Excalibur.Ai.error_message_image_generation_timed_out = options.error_message_image_generation_timed_out;
			Excalibur.Ai.error_unexpected_error_message = options.error_unexpected_error_message;
			Excalibur.Ai.error_message_low_on_credits = options.low_on_credits;
			Excalibur.Ai.generating_image = options.generating_image;
			Excalibur.Ai.credits_used = options.credits_used;
			Excalibur.Ai.web_search_no_results_warning = options.web_search_no_results_warning;
		},

		MediaPicker: {
			WEB_MEDIA_SELECTOR: 'WebMediaSelector',
			LOCAL_MEDIA_SELECTOR: 'LocalMediaSelector',
			AI_MEDIA_SELECTOR: 'AiMediaSelector',

			open: function(){
				Excalibur.Ai.MediaPicker.data = $(this).data();
				Excalibur.Ai.MediaPicker.init();
				Excalibur.Ai.MediaPicker.load();
			},

            // clean this object and abstract open method later
            init: function(){
                if( !Excalibur.Ai.MediaPicker.initialized ) {
                    $(window).on('loadcomplete', function(){
                        Excalibur.Drawer.close_fdrawer(Excalibur.$view.find('.right-drawer'));
                    });
                }

                Excalibur.Ai.MediaPicker.initialized = true;
                Excalibur.Ai.MediaPicker.search = false;
            },

            load: function() {
			    var data = Excalibur.Ai.MediaPicker.data;

                $.ajax({
                    type: 'POST',
                    url: '/media_picker',
                    data: {identifier: data.identifier, object_type: data.object_type, object_id: data.object_id},
                    dataType: 'json',
                    success: function(response) {
                        if (response.status == 'error') {
                            alert(response.message);
                            return false;
                        }
                        // media data
						const web_media_container = response.web_media_container;
						const local_media_container = response.local_media_container;
						const keywords = response.keywords;

						// set drawer and tile template
						Excalibur.Ai.MediaPicker.drawer = Excalibur.Drawer.open_fdrawer.call(  '', Excalibur.$view.find('#media-selector').attr('title'), Excalibur.$view.find('#media-selector').html(), Excalibur.$view.find('.right-drawer'));
						Excalibur.Ai.MediaPicker.tile_template = Excalibur.Ai.MediaPicker.drawer.find('.tile:first');

						// hide tile template for later usage
						Excalibur.Ai.MediaPicker.tile_template.hide();

						// set search input
						Excalibur.Ai.MediaPicker.drawer.find('.media-search > textarea').val(keywords);

						// clear all existing tiles to prevent duplication
						Excalibur.Ai.MediaPicker.drawer.find('.media-selector-tiles').empty();

						// hide any existing warnings
						Excalibur.Ai.MediaPicker._hide_web_search_warning();

						// populate Web Media Selector
						web_media_container.results.forEach(function (item) {
							Excalibur.Ai.MediaPicker.add_tile(Excalibur.Ai.MediaPicker.WEB_MEDIA_SELECTOR, item, data.link);
						});

						// check if local media is present to handle Local tab
						Excalibur.Ai.MediaPicker._has_local_media_results = local_media_container.results && local_media_container.results.length > 0;

						if (Excalibur.Ai.MediaPicker.has_local_media_results()) {
							local_media_container.results.forEach(function (item) {
								Excalibur.Ai.MediaPicker.add_tile(Excalibur.Ai.MediaPicker.LOCAL_MEDIA_SELECTOR, item, data.link);
							});
						}

						// Hide AI tab when Media Picker is opened to update a tile image from the Quick Editor.
						const is_ai_disabled_by_quick_editor = (data.hideAi === true) || (data.hideAi === 'true');
						const is_ai_images_enabled_globally = (Excalibur.$view.find('#media-selector').attr('data-ai-images') === 'true');

						Excalibur.Ai.MediaPicker._is_ai_images_enabled = !is_ai_disabled_by_quick_editor && is_ai_images_enabled_globally;

						if (Excalibur.Ai.MediaPicker.is_ai_images_enabled()) {
							Excalibur.Ai.MediaPicker._hide_image_generation_error_container();
							Excalibur.Ai.MediaPicker.check_for_active_image_task(Excalibur.Ai.MediaPicker.data);
							Excalibur.Ai.MediaPicker._load_ai_tab(
								response.ai_media_container,
								response.credits_available,
								response.credits_needed
							)
                        }

						$('.media-selectors-group').hide();
						if (Excalibur.Ai.MediaPicker.is_ai_images_enabled() || Excalibur.Ai.MediaPicker.has_local_media_results()) {
							$('.media-selectors-group').show();
							$('.media-selectors-group .copilot-tab[data-tab="WebMediaSelector"]').show();
							$('#' + Excalibur.Ai.MediaPicker.WEB_MEDIA_SELECTOR).show();
						}

						if (Excalibur.Ai.MediaPicker.has_local_media_results()) {
							$('.media-selectors-group .copilot-tab[data-tab="LocalMediaSelector"]').show();
							$('#' + Excalibur.Ai.MediaPicker.LOCAL_MEDIA_SELECTOR).show();
						} else {
							$('.media-selectors-group .copilot-tab[data-tab="LocalMediaSelector"]').hide();
							$('#' + Excalibur.Ai.MediaPicker.LOCAL_MEDIA_SELECTOR).hide();
						}

						if (Excalibur.Ai.MediaPicker.is_ai_images_enabled()) {
							$('.media-selectors-group .copilot-tab[data-tab="AiMediaSelector"]').show();
							$('#' + Excalibur.Ai.MediaPicker.AI_MEDIA_SELECTOR).show();
						} else {
							$('.media-selectors-group .copilot-tab[data-tab="AiMediaSelector"]').hide();
							$('#' + Excalibur.Ai.MediaPicker.AI_MEDIA_SELECTOR).hide();
						}


						// Open correct tab based on data source
						if (data.source === 'local_media' && Excalibur.Ai.MediaPicker.has_local_media_results()) {
							toggle_media_selector($('.media-selectors-group .copilot-tab[data-tab="LocalMediaSelector"]'), Excalibur.Ai.MediaPicker.LOCAL_MEDIA_SELECTOR);
						} else if (data.source === 'ai_media' && Excalibur.Ai.MediaPicker.is_ai_images_enabled()) {
							toggle_media_selector($('.media-selectors-group .copilot-tab[data-tab="AiMediaSelector"]'), Excalibur.Ai.MediaPicker.AI_MEDIA_SELECTOR);
						} else {
							toggle_media_selector($('.media-selectors-group .copilot-tab[data-tab="WebMediaSelector"]'), Excalibur.Ai.MediaPicker.WEB_MEDIA_SELECTOR);
						}

						// Handle video-specific behavior
						if (data.type === 'video') {
							$('.media-selectors-group').hide(); // Hide the tabs section
							$('#' + Excalibur.Ai.MediaPicker.WEB_MEDIA_SELECTOR).show();  // Show only WebMediaSelector content
						}

						$(window).one('fdrawerclosed', function(){ Excalibur.Ai.MediaPicker.close.call(); });

						// Attach search only to Web Media Selector
						const search_input = Excalibur.Ai.MediaPicker.drawer.find('.media-search textarea');
						search_input.on('keyup', function(e) {
							const term = $(this).val();
							Excalibur.Ai.MediaPicker.web_search({
								term: term,
								results: web_media_container.results,
								tab_selector: Excalibur.Ai.MediaPicker.WEB_MEDIA_SELECTOR,
								data: data
							});
						});
                    }
                });
            },

			web_search: function({term, results, tab_selector, data}) {
				const typewatch_delay_ms = 700; // Delay for debouncing user input

				typewatch(function() {
					Excalibur.Ai.MediaPicker._hide_web_search_warning();
					Excalibur.Ai.MediaPicker.remove_tiles(tab_selector);

					if (term === '') {
						// If no term is entered, repopulate with original results
						results.forEach(function(item) {
							Excalibur.Ai.MediaPicker.add_tile(tab_selector, item, data.link);
						});

						Excalibur.Ai.MediaPicker.search = false;
					} else {
						$.get('/media_picker/search', { type: data.type, term: term }, function(response) {
							if (response.response && response.response.length === 0) {
								Excalibur.Ai.MediaPicker._display_web_search_warning(Excalibur.Ai.web_search_no_results_warning);
							} else {
								response.response.forEach(function(value) {
									const item = {
										title: value.title,
										link: value.link,
										displayLink: value.display_link
									};

									if (data.type === 'image') {
										item.width = value.width;
										item.height = value.height;
									}

									// Add filtered results as tiles
									Excalibur.Ai.MediaPicker.add_tile(tab_selector, item);
								});
							}

							// Mark search as active
							Excalibur.Ai.MediaPicker.search = true;
						});
					}
				}, typewatch_delay_ms);
			},

			create_ai_image: function() {
				const { identifier, object_type, object_id } = Excalibur.Ai.MediaPicker.data;
				const { AI_MEDIA_SELECTOR, _add_image_generation_loading_tile, _disable_image_generation, _handle_image_generation_failure, _hide_image_generation_error_container, _extract_error_message } = Excalibur.Ai.MediaPicker;
				const $drawer = Excalibur.Ai.MediaPicker.drawer;
				const prompt = $drawer.find('#ai-media-prompt').val().trim();
				const $ai_tab = $('#' + AI_MEDIA_SELECTOR);
				const $tiles_container = $ai_tab.find('.media-selector-tiles');

				if (!prompt) {
					alert(Excalibur.Ai.alert_message_enter_description);
					return;
				}

				_hide_image_generation_error_container();
				_disable_image_generation(true);

				$.ajax({
					url: '/media_picker/create_ai_image',
					method: 'POST',
					dataType: 'json',
					data: { identifier, object_type, object_id, prompt },
					success: function(response) {
					if (response && response.status === 'error') {
							const error_message = response.message || Excalibur.Ai.error_unexpected_error_message;
							_handle_image_generation_failure(error_message);
							return;
						}

						if (response.active_task.task_id) {
							_add_image_generation_loading_tile();

							Excalibur.Ai.MediaPicker.poll_image_generation_status(
								identifier,
								object_type,
								object_id,
								response.active_task.task_id,
								response.active_task,
								$tiles_container
							);

							Excalibur.Ai.MediaPicker.is_poll_in_progress = true;
						}
					},
					error: function(xhr) {
						const error_message = _extract_error_message(xhr);
						_handle_image_generation_failure(error_message);
					}
				});
			},

            add_tile: function(tab_selector, item, link) {
				var tiles_container = $('#' + tab_selector + ' .media-selector-tiles');
                var temp = Excalibur.Ai.MediaPicker.tile_template.clone();
                var thumbnail_link = (Excalibur.Ai.MediaPicker.data.type == 'image' ? item.link : Excalibur.Ai.MediaPicker.yt_thumbnail(item.link));
                var temp_data = {link: item.link, title: item.title, width: item.width, height: item.height, display_link: item.displayLink };

                if (thumbnail_link) {
                    temp.css('background-image', 'url("' + thumbnail_link + '")').css('display', 'inline-block').data(temp_data);

					if (typeof link !== 'undefined') {
						// Compare base URLs without lmsauth parameters
						const item_base_url = Excalibur.Ai.MediaPicker._extract_base_url(item.link);
						const link_base_url = Excalibur.Ai.MediaPicker._extract_base_url(link);

						if (item_base_url === link_base_url) {
							temp.addClass('active');
							Excalibur.Ai.MediaPicker.init_selected = temp.data();
							Excalibur.Ai.MediaPicker.selected = temp.data();
						}
					}
					tiles_container.prepend(temp);
                }
            },

            remove_tiles: function(tab_selector) {
				const tiles_container = $('#' + tab_selector + ' .media-selector-tiles > .tile:visible');
				$.each(Excalibur.Ai.MediaPicker.drawer.find(tiles_container), function(_, v) { v.remove(); });
            },

            select: function() {
                var data = Excalibur.Ai.MediaPicker.data;
                Excalibur.Ai.MediaPicker.selected = this.data();

                Excalibur.method_caller( 'Excalibur.Ai.MediaPicker.' + data.callback);

                this.parent().find('.tile.active').removeClass('active');
                this.addClass('active');
            },

            save: function() {
                var $this = this;
                var data = Excalibur.Ai.MediaPicker.data;

				data.tab = Excalibur.Ai.MediaPicker.current_tab;

				// ensure the selected media link is sent for persistence
				if (Excalibur.Ai.MediaPicker.selected && Excalibur.Ai.MediaPicker.selected.link) {
					data.link = Excalibur.Ai.MediaPicker.selected.link;
				}

                if (Excalibur.Ai.MediaPicker.search == true) {
                    data.search = Excalibur.Ai.MediaPicker.selected;
                } else {
                    delete data.search;
                }

                Excalibur.Ai.MediaPicker.saved = true;

                $.post('/media_picker/set_media/', data, function() {
                    Excalibur.Drawer.close_fdrawer.call($this);
                    Excalibur.Ai.MediaPicker.saved = false;
                })
            },

            close: function() {
                var data = Excalibur.Ai.MediaPicker.data;

                if( !Excalibur.Ai.MediaPicker.saved && Excalibur.Ai.MediaPicker.selected != Excalibur.Ai.MediaPicker.init_selected ) {
                    Excalibur.Ai.MediaPicker.selected = Excalibur.Ai.MediaPicker.init_selected;
                    Excalibur.method_caller( 'Excalibur.Ai.MediaPicker.' + data.callback);
                }
            },

            yt_thumbnail: function(url) {
				const video_id = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/);

				if (video_id && video_id[1]) {
					return `http://img.youtube.com/vi/${video_id[1]}/hqdefault.jpg`;
				}

				return null;
            },

            update_html: function() {
                var data = Excalibur.Ai.MediaPicker.data;
                var selected = Excalibur.Ai.MediaPicker.selected;
                let wrapper =  $("." + data.identifier);

                if (data.type == 'image') {
                    wrapper.find('.media_wrapper').html('<img src="' + selected.link + '" title="' + selected.title + '" alt="' + selected.title + '" width="' + selected.width + '" height="' + selected.height + '">');
                } else {
                    let youtube = wrapper.find('.media_wrapper .resource-youtube');
                    let height = youtube.outerHeight();
                    let temp_unique_id = Math.random().toString(16).slice(2);

                    youtube.html('<div id="' + temp_unique_id + '"></div>');
                    youtube.css('padding-bottom', 0);

                    new YT.Player(temp_unique_id, {width: '100%', height: height, videoId: selected.link.split('v=')[1]});
                }

                // update the button data-link
                wrapper.find('.footer .link').text(selected.link);
                wrapper.find('.footer button').data('link', selected.link);
            },

            update_tiles: function() {
                var data = Excalibur.Ai.MediaPicker.data;
                var selected = Excalibur.Ai.MediaPicker.selected;
                $("." + data.identifier).find('.flex_fixer div').attr("style", "background-image: url('" + selected.link + "')");
            },

            update_menu: function() {
                var data = Excalibur.Ai.MediaPicker.data;
                var selected = Excalibur.Ai.MediaPicker.selected;
                $("." + data.identifier).parents('.img_crop_wrap').find('img').attr('src', selected.link);
            },

			link_click: function(){
				window.open( this.attr('href') );
			},

			check_for_active_image_task: function(data) {
				const { AI_MEDIA_SELECTOR, _add_image_generation_loading_tile, _disable_image_generation, _extract_error_message, _handle_image_generation_failure } = Excalibur.Ai.MediaPicker;

				$.ajax({
					url: '/media_picker/check_for_active_image_task',
					method: 'GET',
					data: {
						identifier: data.identifier,
						object_type: data.object_type,
						object_id: data.object_id
					},
					success: function(response) {
						if (response.active_task) {
							_disable_image_generation(true);
							_add_image_generation_loading_tile();

							if (!Excalibur.Ai.MediaPicker.is_poll_in_progress) {
								const $ai_tab = $('#' + AI_MEDIA_SELECTOR);
								const $tiles_container = $ai_tab.find('.media-selector-tiles');

								Excalibur.Ai.MediaPicker.poll_image_generation_status(
									data.identifier,
									data.object_type,
									data.object_id,
									response.active_task.task_id,
									response.active_task,
									$tiles_container
								);

								Excalibur.Ai.MediaPicker.is_poll_in_progress = true;
							}
						}
					},
					error: function(xhr) {
						const error_message = _extract_error_message(xhr);
						_handle_image_generation_failure(error_message);
					}
				});
			},

			poll_image_generation_status: function(identifier, object_type, object_id, task_id, active_task, tiles_container, attempt = 0) {
				const MAX_ATTEMPTS = 60;
				const POLL_INTERVAL_MS = 3000;
				const { _handle_image_generation_failure, _extract_error_message } = Excalibur.Ai.MediaPicker;

				if (attempt > MAX_ATTEMPTS) {
					const error_message = Excalibur.Ai.error_message_image_generation_timed_out;
					_handle_image_generation_failure(error_message);
					return;
				}

				$.ajax({
					url: '/media_picker/get_image_status',
					method: 'GET',
					dataType: 'json',
					data: { task_id, identifier, object_type, object_id },
					success: function(response) {
						if (response.status === 'complete' && response.link) {
							const { title, link, width, height, credits_used } = response;
							const item = { title, link, width, height };
							const { add_tile, AI_MEDIA_SELECTOR, _display_credits_used, _dynamically_update_available_credits, _handle_credit_validation, _remove_image_generation_loading_tile, _set_original_prompt } = Excalibur.Ai.MediaPicker;

							// NOTE: Checks if generated image belongs to the current data.identifier
							if (Excalibur.Ai.MediaPicker.data && (Excalibur.Ai.MediaPicker.data.identifier === active_task.source_id)) {
								_set_original_prompt(active_task.user_prompt);
								_remove_image_generation_loading_tile();
								add_tile(AI_MEDIA_SELECTOR, item);
								_display_credits_used(credits_used);
							}
							_dynamically_update_available_credits(credits_used);
							_handle_credit_validation(credits_used);
						}
						else if (response.status === 'pending') {
							setTimeout(() => {
								Excalibur.Ai.MediaPicker.poll_image_generation_status(identifier, object_type, object_id, task_id, active_task, tiles_container, attempt + 1);
							}, POLL_INTERVAL_MS); // TODO: add exponential backoff
						}
						else if (response.status === 'error') {
							const error_message = response.message || Excalibur.Ai.error_unexpected_error_message;
							_handle_image_generation_failure(error_message);
						}
					},
					error: function(xhr) {
						const error_message = _extract_error_message(xhr);
						_handle_image_generation_failure(error_message);
					}
				});
			},

			has_local_media_results: function() {
				return Excalibur.Ai.MediaPicker._has_local_media_results || false;
			},

			is_ai_images_enabled: function() {
				return Excalibur.Ai.MediaPicker._is_ai_images_enabled === true;
			},

			_load_ai_tab: function(ai_media_container, credits_available, credits_needed) {
				const { _set_credit_values, _handle_credit_validation, add_tile, AI_MEDIA_SELECTOR, data } = Excalibur.Ai.MediaPicker;
				_set_credit_values(credits_available, credits_needed);
				_handle_credit_validation(credits_needed)

				if (ai_media_container?.results?.length) {
					ai_media_container.results.forEach(item => {
						add_tile(AI_MEDIA_SELECTOR, item, data.link);
					});
				}
			},

			_enable_image_generation: function() {
				const $drawer = Excalibur.Ai.MediaPicker.drawer;
				const $generate_button = $drawer.find('.ai-generate-btn');
				const $prompt = $drawer.find('#ai-media-prompt');

				$generate_button.prop('disabled', false);
				$prompt.prop('disabled', false);
				$prompt.val(null);

				if (Excalibur.Ai.MediaPicker.original_prompt) {
					$prompt.val(Excalibur.Ai.MediaPicker.original_prompt);
					Excalibur.Ai.MediaPicker.original_prompt = null;
				}
			},

			_disable_image_generation: function(is_for_image_generation=false) {
				const $drawer = Excalibur.Ai.MediaPicker.drawer;
				const $generate_button = $drawer.find('.ai-generate-btn');
				const $prompt = $drawer.find('#ai-media-prompt');

				$generate_button.prop('disabled', true);
				$prompt.prop('disabled', true);

				if (is_for_image_generation) {
					$prompt.val(Excalibur.Ai.generating_image);
				}
			},

			_set_original_prompt: function(user_prompt) {
				Excalibur.Ai.MediaPicker.original_prompt = user_prompt;
			},

			_add_image_generation_loading_tile: function() {
				const ai_tab = $('#' + Excalibur.Ai.MediaPicker.AI_MEDIA_SELECTOR);
				const tiles_container = ai_tab.find('.media-selector-tiles');

				const loading_tile = document.createElement('div');
				loading_tile.className = 'tile loading-tile';
				loading_tile.innerHTML =
					`<div class="ai-loading-dots">
						<div class="dot"></div>
						<div class="dot"></div>
						<div class="dot"></div>
					</div>`;

				Excalibur.Ai.MediaPicker._current_loading_tile = loading_tile;

				tiles_container.prepend(loading_tile);
			},

			_remove_image_generation_loading_tile: function() {
				if (Excalibur.Ai.MediaPicker._current_loading_tile) {
					Excalibur.Ai.MediaPicker._current_loading_tile.remove();
					Excalibur.Ai.MediaPicker._current_loading_tile = null;
				}
			},

			_display_credits_used: function(credits_used) {
				const {drawer, _convert_value_to_int} = Excalibur.Ai.MediaPicker;

				drawer.find('#credits-display .credits-label').text(Excalibur.Ai.credits_used);
				drawer.find('#credits-display .credits-needed-value').text(_convert_value_to_int(credits_used));
			},

			_dynamically_update_available_credits: function(credits_used) {
				const {drawer, _convert_value_to_int} = Excalibur.Ai.MediaPicker;
				const credits_available = drawer.find('.credits-available-value').text();
				const updated_credits_available = _convert_value_to_int(credits_available - credits_used)

				drawer.find('.credits-available-value').text(updated_credits_available);
			},

			_set_credit_values: function(credits_available, credits_needed) {
				const {drawer, _convert_value_to_int} = Excalibur.Ai.MediaPicker;

				drawer.find('.credits-available-value').text(_convert_value_to_int(credits_available));
				drawer.find('.credits-needed-value').text(_convert_value_to_int(credits_needed));
			},

			_has_sufficient_credits: function(credits_needed) {
				const {drawer, _convert_value_to_int} = Excalibur.Ai.MediaPicker;
				const credits_available = drawer.find('.credits-available-value').text();

				return _convert_value_to_int(credits_available) >= _convert_value_to_int(credits_needed);
			},

			_handle_credit_validation: function(credits_used) {
				const { _has_sufficient_credits, _enable_image_generation, _display_image_generation_error_message, _disable_image_generation } = Excalibur.Ai.MediaPicker;

				if (_has_sufficient_credits(credits_used)) {
					_enable_image_generation();
				} else {
					const error_message = Excalibur.Ai.error_message_low_on_credits;
					_display_image_generation_error_message(error_message);
					_disable_image_generation();
				}
			},

			_convert_value_to_int: function (credits) {
				return Math.round(Number(credits));
			},

			_hide_image_generation_error_container: function() {
				const drawer = Excalibur.Ai.MediaPicker.drawer;
				drawer.find('.ai-media-error-textbox').text('');
				drawer.find('.ai-media-error').hide();
			},

			_display_image_generation_error_message: function(error_message) {
				const drawer = Excalibur.Ai.MediaPicker.drawer;
				drawer.find('.ai-media-error-textbox').text(error_message);
				drawer.find('.ai-media-error').show();
			},

			_handle_image_generation_failure: function(error_message) {
				const { _remove_image_generation_loading_tile, _display_image_generation_error_message, _enable_image_generation } = Excalibur.Ai.MediaPicker;
				_remove_image_generation_loading_tile();
				_display_image_generation_error_message(error_message);
				_enable_image_generation();
			},

			_extract_error_message: function(xhr) {
				return xhr.responseJSON?.message
					|| xhr.responseText
					|| Excalibur.Ai.error_unexpected_error_message;
			},

			_extract_base_url: function(link) {
				return link.split('?')[0];
			},

			_hide_web_search_warning: function() {
				const drawer = Excalibur.Ai.MediaPicker.drawer;
				if (drawer) {
					drawer.find('.web-media-warning-textbox').text('');
					drawer.find('.web-media-warning').hide();
				}
			},

			_display_web_search_warning: function(warning_message) {
				const drawer = Excalibur.Ai.MediaPicker.drawer;
				if (drawer) {
					drawer.find('.web-media-warning-textbox').text(warning_message);
					drawer.find('.web-media-warning').show();
				}
			}
		}
	},

	Drawer: {
		open: function(drawer, callback) {
			drawer = drawer || Excalibur.$view.find('.right-drawer');
			drawer.addClass('active');
			var list = drawer.find('.drawer-content .item-list');
			var url = drawer.find('.drawer-content').attr('url');

			if ($('button.ai-fab').length > 0) {
				$('button.ai-fab').addClass('close');
				Excalibur.Drawer.fab = true;
			}

			if (url) {
                $.get(url, function(html) {
                    Excalibur.Location_tools.no_render_jobj(html, function($html) {
                        if ($html.find('#wrapper').length) {
                            console.log('fail ', $html);
                        } else {
                            var token_count = $html.find('.token-count');

                            list.empty();
                            list.parent().find('.token-count').html(token_count.html());
                            token_count.remove();
                            list.append($html);
                            callback && callback(drawer);


                            setTimeout(function() {
                                if (drawer.hasClass('fat-open')) { return; }
                                var focusTarget = list.find('.drawer-item.applicable').first();
                                if (!focusTarget.length) { focusTarget = list.find('button, a, [tabindex="0"]').first(); }
                                if (focusTarget.length) { focusTarget.focus(); }
                            }, 100);
                        }
                    });
                });
            }

			return drawer;
		},

		close: function(drawer) {
			drawer = drawer || Excalibur.$view.find('.right-drawer');
			drawer.removeClass('active');

			if (Excalibur.Drawer.fab == true) {
				$('button.ai-fab').removeClass('close');
				// Return focus to FAB button when drawer closes for accessibility
				$('button.ai-fab').focus();
			}

			return drawer;
		},

		toggle: function() {
			var drawer = this.closest('.right-drawer');

			if (drawer.length == 0) {
			    drawer = Excalibur.$view.find('.right-drawer')
            }

			if (drawer.hasClass('active')) {
                Excalibur.Drawer.close(drawer);
            } else {
                Excalibur.Drawer.open(drawer);
            }
		},

		open_fdrawer: function(title, content, drawer) {
			var drawer = drawer || Excalibur.$view.find('.right-drawer');
			var fdrawer = drawer.find('.fat-drawer');
			var url = null;
			var copilot_chat = null;

			if (typeof this.attr == 'function') {
				url = this.attr('url');
				copilot_chat = this.attr('copilot-chat');
			}

			if (drawer.hasClass('fat-open')) {
				// Reuse fdrawer
				fdrawer.find('.fat-drawer__header .fat_drawer__header-title').html('<h2>' + title + '</h2>');
				fdrawer.find('.content').html(content);
				return fdrawer;
            }

			if (Excalibur.Drawer.fab == true) {
				$('button.ai-fab').hide();
			}

			if (!title && !content && url) {
				$.get(url, function(html) {
					Excalibur.Location_tools.no_render_jobj(html, function($html) {
						if ($html.find('#wrapper').length) {
                            console.log('fail ', $html);
                        } else {
                            var header = ($html.find('.fat-drawer__header').length ? $html.find('.fat-drawer__header') : null);
                            var append_to = fdrawer.find('.content');

                            if (copilot_chat == 'true') {
                                append_to = fdrawer;
                                header && header[0].remove();
                                fdrawer.find('.fat-drawer__header').hide();
                                fdrawer.find('.content').hide();
                            } else {
                                header && fdrawer.find('.fat-drawer__header').html(header.html());
                                header && header.remove();
                            }

                            append_to.append($html);
                            Excalibur.Drawer.open(drawer);
                            drawer.addClass('fat-open');

                            if (copilot_chat == 'true') {
                                drawer.addClass('large');
                            }

                            setTimeout(function() {
                                var fatFocusTarget = fdrawer.find('button, a, [tabindex="0"], input').first();
                                if (fatFocusTarget.length) { fatFocusTarget.focus(); }
                            }, 100);
						}
					});
				});
			} else {
				drawer.addClass('fat-open');
				fdrawer.find('.fat_drawer__header-title').html('<h2>' + title + '</h2>');
				fdrawer.find('.content').html(content);

				return fdrawer;
			}
		},

		close_fdrawer: function(drawer) {
			drawer = drawer || this.closest('.right-drawer');
			drawer.removeClass('fat-open');
			drawer.find('.fat-drawer .content').show().empty();
			drawer.find('.content').next().remove();
			drawer.find('.fat-drawer .fat-drawer__header').show();
			drawer.find('.fat-drawer .fat-drawer__header .fat_drawer__header-title').text('');

			if (drawer.hasClass('large')) {
			    drawer.removeClass('large');
			}

			if (Excalibur.Drawer.fab == true) {
				$('button.ai-fab').show();
			}

			this.data && this.data("closeAllDrawer") && Excalibur.Drawer.close(drawer);

			$(window).trigger('fdrawerclosed');
		},

		close_agent: function(drawer) {
			let url = '/agent/get_credits';
			drawer = drawer || this.closest('.right-drawer');
			$.get(url, function(data) {
				$('.token-count .token-number').text(data.credits);
				Excalibur.Drawer.close_fdrawer(drawer);
			})
		},
	},

	Input: {
		increment: function( input ){
			var input = input || this.parent().find('input');
			if(!input.is('input'))
				input = this.siblings('input');
			var max = parseInt(input.attr('max') || '10000000') - 1;
			var input_val = Math.min(parseInt(input.val()), max);
			input.val( input_val + 1 );
			return input.val();
		},

		decrement: function( input ) {
			var input = input || this.parent().find('input');
			if(!input.is('input'))
				input = this.siblings('input');
			var min = parseInt(input.attr('min') || '0') + 1;
			var input_val = Math.max(parseInt(input.val()), min);
			input.val( input_val - 1);
			return input.val();
		},

		check_max_min: function(input){
			var input = input || (this.is('input') ? this : this.parent().find('input'));
			if(!input.is('input'))
				input = this.siblings('input');
			var min = parseInt(input.attr('min') || '0');
			var max = parseInt(input.attr('max') || '10000000');
			var input_val = Math.min(Math.max(parseInt(input.val()), min), max);
			input.val( input_val );
			return input.val();
		},

		policy_verify: function(){
			var input = this;
			if(input.is(':checked'))
				input.closest('.content').find('.footer button').removeAttr('disabled');
			else
				input.closest('.content').find('.footer button').attr('disabled', true);
		}
	},

	accordion_toggle: function(){
		var $elem = this;
		var parent = $elem.parent();
		if( parent.hasClass('active') )
			parent.parent().find('.active').removeClass('active');
		else{
			parent.parent().find('.active').removeClass('active');
			parent.addClass('active');
		}

	},

    accordion_toggle_multiple: function(){
        var $elem = this;
        var parent = $elem.parent();

        if (parent.hasClass('active')) {
            parent.removeClass('active');
        } else {
            parent.addClass('active');
        }

    },

	Toc: {
		//table of content code

		section_nav_handle_click: function(){
			Excalibur.$view.toggleClass('section_nav_open');

			$.post('/account/set_show_table_contents', { value: Excalibur.$view.hasClass('section_nav_open') });
		},

		expand_contract_all_click: function(){
			var elems = this.parent().find('> ul > li');
			var span = this.find('span:first');
			if( span.hasClass('expand_all') ) {
				elems.addClass('open');
				span.removeClass('expand_all');
				window.expand_toc = true;
			}
			else {
				elems.removeClass('open');
				span.addClass('expand_all');
				window.expand_toc = false;
			}
		},

		expand_contract_click: function(){
			this.closest('li').toggleClass('open');
		},


		load_toc: function(){
			//load table of content page
			if( !this.hasClass('locked') ) {
				var section_nav = Excalibur.$view.find('.section_nav');
				if(section_nav.length > 0) {
					section_nav.find('ul .selected').removeClass('selected');
					if (this.hasClass('header-nav')) {
						var selected = section_nav.find('[href="' + this.attr('href') + '"]');
						selected.addClass('selected');
					}
					else
						var selected = this.addClass('selected');

					selected.length && Excalibur.Toc.toc_selected(section_nav, selected);

					$(window).one('preload', function (e, data) {
						Excalibur.Router.toc_update(data.obj);
						if(!selected.length) {
							selected = section_nav.find('.selected');
							Excalibur.Toc.toc_selected(section_nav, selected);
						}
					});
					Excalibur.Router.load.call(this, null, null, null, 'Excalibur.Toc.toc_back');
				}
				else
					Excalibur.Mobile.Router.load.call(this);
			}
		},

		toc_back: function(){
			Excalibur.$view.find('.section_nav ul .selected').removeClass('selected');
			var target = Excalibur.$view.find('.section_nav ul [href="' + this + '"]');
			target.addClass('selected');
			$(window).one('preload', function( e, data ){
				Excalibur.Toc.toc_update( data.obj );
			});
		},

		toc_update: function( $html ){
			var current_modules = Excalibur.$view.find('.section_nav .module_sections');
			var incoming_modules = $html.find('.section_nav .module_sections');
			var parent_div = current_modules.first().parent().closest('ul');
			incoming_modules.each( function( i ){
				var $elem = $(this);
				if(i > current_modules.length)
					parent_div.append($elem.closest('li'));
				else
					$(current_modules[i]).replaceWith($elem);
			});
			if(	$html.find('header > .section_progress').length )
				Excalibur.$view.find('header > .section_progress').replaceWith( $html.find('header > .section_progress') );
			if(	$html.find('.section_nav .section_progress').length )
				Excalibur.$view.find('.section_nav .section_progress').replaceWith( $html.find('.section_nav .section_progress') );
		},

		toc_selected: function(section_nav, selected){
			var to_open = selected.closest('[class*="module"]').closest('li');
			!window.expand_toc && section_nav.find('.open').removeClass('open').find('button.expand_contract');
			to_open.addClass('open');
			to_open.find('button.expand_contract');
		},
	},

	Suggestions: {

		open: function(){
			var $elem = this;
			var container = $elem.closest('.search-container');
			if( $elem.hasClass('search-drop') && container.hasClass('active') ){
				Excalibur.Suggestions.close();
			}
			else {
				Excalibur.any_click(container, container, Excalibur.Suggestions.close);
				container.addClass('active');
			}


		},

		close: function(){
			Excalibur.$view.find('.search-container').removeClass('active');
			Excalibur.$view.off('click', Excalibur.any_click_function);
		},

		search: function(){
			var content = this.closest('.search-container').find('.search-content');
			if( this.val() != '' ){
				if (!Excalibur.Suggestions.loading ) {
					content.empty();
					Excalibur.Suggestions.loading = true;
					Excalibur.Location_tools.add_load_indicator(content, 300);
				}
				Excalibur.Hit_manager.simple_hit('/search_simple/evo_search', {phrase: this.val()}, 600, null, function (html) {
					content.empty().append(html).removeClass('extended-load');
					Excalibur.Suggestions.loading = false;
					if (html.trim().length == 0) {
						$('#search-no-result').css('display', 'block');
					} else {
						$('#search-no-result').css('display', 'none');
					}
				});
			}
			else {
				content.empty();
				Excalibur.Suggestions.loading = false;
				$('#search-no-result').css('display', 'none');
			}

		},

		result_click: function(){
			Excalibur.Mobile.Router.load( this.find('a[href]:first').attr('href') );
			Excalibur.Suggestions.close();
			Excalibur.Suggestions.empty_search_box();
		},

		view_more_click: function(){
			Excalibur.Mobile.Router.load( this.attr('href') );
			Excalibur.Suggestions.close();
			Excalibur.Suggestions.empty_search_box();
		},

		empty_search_box: function(){
			$('#search_phrase').val('');
		}
	},

	DropDown: {
		load_page: function () {
			Excalibur.Router.load(this.attr('href'));
			Excalibur.DropDown.close(this);
		},

		close: function (target) {
			target.closest('.dropDown') && target.closest('.dropDown').first().removeClass('dDownShow');
		}
	}
}

// initialize Excalibur
$(function () {
	Excalibur.init();
});

function updatePageTitle() {
  var title_text = '';
  var nav_selected = '';
  var page_heading = '';
  var tab_text = '';

  // Small delay to ensure content is loaded
  setTimeout(function () {
    nav_selected = $('nav#user-menu > ol > li > a.selected').first().text().trim();

    if (nav_selected && nav_selected.toLowerCase() === 'home') {
      title_text = nav_selected;
    } else {
      title_text = $('.sectionTitle h1').text().trim();
    }

    if ($('#user-menu .sub-menu.active a.selected').length) {
      page_heading = $('#user-menu .sub-menu.active a.selected').first().text().trim();
    } else if ($('#centreColumn .pageHeading:not(.mobile_only) h1').length) {
      page_heading = $('#centreColumn .pageHeading:not(.mobile_only) h1').first().text().trim();
    } else if ($('#mainContent .dashboard_header h2').length) {
      page_heading = $('#mainContent .dashboard_header h2').first().text().trim();
    }

    if (page_heading) {
      title_text = title_text ? title_text + ' - ' + page_heading : page_heading;
    }

    if ($('#centreColumn .tabnav .tabnav__tab.selected').length) {
      tab_text = $('#centreColumn .tabnav .tabnav__tab.selected').first().contents().filter(function () {
        return this.nodeType === 3; // Only get text nodes
      }).text().trim();

      if (tab_text) {
        title_text = title_text ? title_text + ' - ' + tab_text : tab_text;
      }
    }

    title_text = (title_text || '').toString();

    var base_title = $('head title').html().split(' - ')[0];
    $('head title').html(base_title + ' - ' + title_text.replace(/<(.*?)>(.*?)<(.*?)>/g, ''));
  }, 100);
}
