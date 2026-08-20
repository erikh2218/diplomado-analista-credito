if(!is_mobile_app_mode()){
	Modernizr.load([
		{
			// Polyfill mediaquery support for browsers without it
			test: Modernizr.mq('only all'),
			nope: '/javascripts/plugins/respond.min.js'
		}, {
			// Polyfill placeholder support for browsers without it
			test: Modernizr.placeholder,
			nope: '/javascripts/plugins/jquery.placeholder.js',
			complete : function () {
				$('input, textarea').placeholder();
			}
		}, {
			test: Modernizr.csscolumns,
			nope: '/javascripts/plugins/jquery.columnizer.min.js',
			complete : function () {
				if (!Modernizr.csscolumns) {
					$('.testimonialsHolder .testimonial').addClass('dontsplit');
					$('.testimonialsHolder').columnize({ columns: 3, lastNeverTallest: true });
				}
			}
		}
	]);

	if(!Modernizr.svg) {
		$('img[src*="svg"]').attr('src', function() {
			return $(this).attr('src').replace('.svg', '.png');
		});
	}
}

// Responsive Adjustments
var busy_loading_menu = false,
	menu_scripts_loaded = false,
	mobile_menu_on = false;

function responsive_update() {
	if ($(window).width() < 980 && !menu_scripts_loaded && !busy_loading_menu) {
		// load scripts once-off
		busy_loading_menu = true;
		Modernizr.load([{
			test: Modernizr.mq("only screen and (max-width:979px)"),
			yep: ['/javascripts/plugins/mmenu/jquery.mmenu.min.all.js', '/javascripts/plugins/mmenu/jquery.mmenu.css?3', '/javascripts/plugins/mmenu/extensions/jquery.mmenu.positioning.css'],
			complete : function () {
				if(Modernizr.mq("only screen and (max-width:979px)")) {
					// load mobile main menu
					$("nav#main-menu .dropDown ul").unwrap();
					$("nav#main-menu").removeClass('mainNav');
					$("header").addClass('mm-fixed-top');
					if($("#main-menu").length){
						$("#main-menu").mmenu({
							slidingSubmenus: false,
							moveBackground: false
						}, {
							selectedClass: "selected",
							clone: true
						});
						$("nav.mm-menu li.mm-selected ul li a").each(function(){
							if(location.href.indexOf($(this).attr('href')) > -1){
								$(this).parent().addClass('mm-selected');
								$(this).parent().parent().parent().removeClass('mm-selected');
							}
						});
					}
					// load portal search form
					if($("#school-form").length){
						$("#school-form").mmenu({
							isMenu: false,
							position: "right"
						}, {
							clone: true
						});
					}

					//close menu when search button is clicked
					$('.searchSchoolForm').submit(function(){
						if ($("#mm-school-form").hasClass('mm-opened'))
							$("#mm-school-form").trigger( "close.mm" );
					});

					//close menu when facebox is opened
					$(document).bind('reveal.facebox', function() {
						if ($("#mm-school-form").hasClass('mm-opened'))
							$("#mm-school-form").trigger( "close.mm" );
						if ($("#mm-main-menu").hasClass('mm-opened'))
							$("#mm-main-menu").trigger( "close.mm" );
					});
					$('#mm-portal_name').attr('id', 'portal_name');
					$('nav.mm-menu a').each(function(){
						if($(this).attr('href') == '#' || $(this).attr('href') == ''){
							$(this).attr('href', 'javascript:void(0)');
						}
					});
					$('nav#mm-main-menu').on('opening.mm', function () {
						$('#mm-main-menu a:visible').first().focus();
					});
					$('.mm-subopen').siblings('a').click(function(){
						if($(this).attr('href').substring(0,10) == "javascript"){
							$(this).parent().toggleClass('mm-opened');
							$(this).parent().siblings('li').removeClass('mm-opened');
						}else if(!$(this).parent().hasClass('mm-opened')){
							$(this).parent().toggleClass('mm-opened');
							$(this).parent().siblings('li').removeClass('mm-opened');
							return false;
						}
					});
					$('.mm-subopen').click(function(){
						$(this).parent().siblings('li').removeClass('mm-opened');
						$(this).parent().hasClass('mm-opened') ? $(this).attr('aria-expanded', 'true') : $(this).attr('aria-expanded', 'false');
					});

					menu_scripts_loaded = true;
					mobile_menu_on = true;
				}
			}
		}
		]);
	} else if ($(window).width() < 980 && menu_scripts_loaded && !mobile_menu_on) {
		// switched back to smaller screen, fires once after breakpoint change	
		mobile_menu_on = true;
	} else if ($(window).width() >= 980 && menu_scripts_loaded && mobile_menu_on) {
		// switched to larger screen, fires once after breakpoint change			
		mobile_menu_on = false;
		$("nav#main-menu li ul").wrap('<div class="dropDown"></div>');
		$("nav#main-menu").addClass('mainNav');

		if ($("#mm-main-menu").hasClass('mm-opened'))
			$("#mm-main-menu").trigger( "close.mm" );
	}

	// Position Facebox
	if ($("#facebox").is(':visible')) {
		var faceboxWidthHalved = $('#facebox .popup').outerWidth() / 2;
		var top_offset = ($(window).height() - $('#facebox').outerHeight()) / 5;
		$('#facebox').css({'top': top_offset < 40 ? 40 : top_offset, 'left': $(window).width() / 2 - faceboxWidthHalved});
	}

	$('.newSite #facebox.valignModal').css('top',"50%");

	// Back to Top link
	if (($('#wrapper').outerHeight() > $(window).height()) && ($(window).width() < 980)) {
		$('html a.back-to-top').css('display','block');
	} else {
		$('html a.back-to-top').css('display','none');
	}

	//for width < 480, set fixed height for carousel images
	if($(window).width() < 480){
		$('.bjqs .imgContainer').css('height', Math.round( (773 / 1550) * $(window).width()));
	}else{
		$('.bjqs .imgContainer').removeAttr('style');
	}

	//fix wrapping for title in mobile mode
	$mobileTitleSpan = $('header .mobileBar .middleMobileBar span');
	if($mobileTitleSpan.height() > 25){
		$mobileTitleSpan.css({marginTop: -8, fontSize: '14px'});
	}else{
		$mobileTitleSpan.removeAttr('style');
	}

	//color headings
	if($('body').hasClass('color-heading') && $('#contentHeader h1').html() == '&nbsp;' && !$('body').hasClass('catalog_class')){
		var content_header_text = '';
		if($('body').hasClass('ctr_visitor_cart')){
			content_header_text = $('nav.mainNav li.selected a span.floatL').html();
		}else if($('#centreColumn').length){
			content_header_text = $('#centreColumn h1').html();
		}else{
			if($('h1#current_month').length){
				content_header_text = $('nav.mainNav li.selected a').html();
			}else{
				content_header_text = $('#contentBody h1').html();
			}
		}
		$('#contentHeader h1').html(content_header_text);
	}
}

function move_profile_img(imagePath) {
	$(imagePath).each(function() {
		$(this).parent().addClass("oldProfileImg");
		if($(this).parent().next().children('a').length){
			var link = $(this).parent().next().children('a').first().attr('href');
			$(this).clone().prependTo($(this).parent().next()).wrap('<span class="newProfileImg"><a href="'+link+'"></a></span>');
		}else{
			$(this).clone().prependTo($(this).parent().next()).wrap('<span class="newProfileImg"></span>');
		}
	});
}

$(document).ready(function(){
	if(!is_mobile_app_mode()){
		responsive_update();
		if ($('body.portal').length) tabnav_adjustment('.catalog_item_tabs');
	}
});

$(window).resize(function(){
	if(!is_mobile_app_mode()){
		globalWindowWidth = $(window).width();
		globalWindowHeight = $(window).height();
		responsive_update();
		if ($('body.portal').length) tabnav_adjustment('.catalog_item_tabs');
	}
});

Response.create([
	{
		prop: "device-pixel-ratio",
		prefix: "pixel-density-"
	},
	{
		prop: "width",
		breakpoints: [0, 320, 560, 980]
	}
]);
