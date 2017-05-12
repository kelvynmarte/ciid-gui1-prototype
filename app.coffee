Framer.Extras.Preloader.enable()

# Import file "Look Out 7 Framer" (sizes and positions are scaled 1:3)
sketch5 = Framer.Importer.load("imported/Look Out 7 Framer@3x")
Utils.globalLayers(sketch5)

# STATES

currentState = 0
nextState = () ->
	currentState++
	changeState(currentState)
	
changeState = (state) ->
	currentState = state
	switch state
		when 0
		
			sketch5.onboardingText.stateSwitch "hide"
			sketch5.warningNotification.stateSwitch "hide"
			sketch5.mapDetail.stateSwitch "hide"

			Utils.delay 1.0, ->
				onboardingBackgroundIcon.animate "show"
				onboardingBackground.animate "show"
				sketch5.onboardingText.animate "show"
				onboardingBackgroundIconAnimationPulse.start()
				
			Utils.delay 1.8, ->
				onboardingBackgroundIconAnimationPulse.start()
				
			Utils.delay 6.0, ->
				warningAnimationPulse1.start()
				warningAnimationPulse2.start()
			
			# 	AUTO FORWARD TO NEXT STATE		
			Utils.delay 8.0, ->
				changeState(1)
		
		when 1
			onboardingBackgroundIcon.animate "hide"
			onboardingBackground.animate "hide"
			sketch5.onboardingText.animate "hide"
			sketch5.onboardingWarningSign.animate "hide"
			onboardingBackgroundIconAnimationPulse.stop()
			
		when 2
			sketch5.warningNotification.animate "show"
			
		when 3
			sketch5.warningSign.animate "hide"
			sketch5.warningNotification.animate "hide"
			Utils.delay 0.6, ->
				sketch5.map.animate "zoomToWarning"
				sketch5.mapDetail.animate "show"

# SPACEBREW 
# 
# Spacebrew = require("npm").Spacebrew
# 
# sb = undefined
# app_name = 'Look Out'
# values = {}
# ###*
# # setupSpacebrew Function that creates and configures the connection to the Spacebrew server.
# # 				  It is called when the page loads.
# ###
# onRangeMessage = (name, value) ->
#   console.log 'Received new range message ', value
#   print value
#   return
# 
# onOpen = () ->
# 	print "spacebrew connection"
# 	return
# 	
# setupSpacebrew = ->
# 	random_id = '0000' + Math.floor(Math.random() * 10000)
# 	app_name = app_name + ' ' + random_id.substring(random_id.length - 4)
# 	console.log 'Setting up spacebrew connection'
# 	sb = new (Spacebrew.Client)
# 	sb.name app_name
# 	sb.description 'Sliders for sending and displaying SpaceBrew range messages.'
# 	sb.addSubscribe 'slider1', 'range'
# 	# override Spacebrew events - this is how you catch events coming from Spacebrew
# 	sb.onRangeMessage = onRangeMessage
# 	sb.onOpen = onOpen
# 	# connect to spacbrew
# 	sb.connect()
# 	return
# Utils.delay 1.0, ->
# 	setupSpacebrew()

# WARNING NOTIFICATION
# 

sketch5.warningNotification.states.hide =
	x: -10
	y: -372
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6
	
sketch5.warningNotification.states.show =
	x: -10
	y: -10
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6
	


# REPORT BUTTON
# 

sketch5.reportButton.visible = false


reportButton = new Layer
	y: 1555
	x: 25
	width: 1032
	height: 189
	backgroundColor: "rgba(0,0,0,1)"
	shadowColor: "rgba(0,0,0,0.24)"
	shadowY: 6
	shadowBlur: 6
	borderRadius: 6
	clip: true
	


reportButtonClick = new Layer
	superLayer: reportButton
	width: 34
	height: 34
	x: 498
	y: 68
	borderRadius: 1200
	backgroundColor: "rgba(251,245,34,1)"
	borderWidth: 1
	borderColor: "rgba(123,123,123,0)"
	opacity: 0.00
	
reportButtonClick.states.defualt =
	scale: 1
	opacity: 0.0
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6
		
reportButtonClick.states.tap =
	scale: 40.00
	opacity: 0.17
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)" #Spring(0.75)
		time: 0.6

reportButton.states.default =
	backgroundColor: "rgba(0,0,0,1)"
	shadowColor: "rgba(0,0,0,0.24)"
	shadowY: 6
	shadowBlur: 6
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)" #Spring(0.75)
		time: 0.3
	
reportButton.states.tap =
	#backgroundColor: "rgba(37,38,37,1)"
	shadowColor: "rgba(0,0,0,0.5)"
	shadowY: 24
	shadowBlur: 24
	shadowSpread: 1
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)" #Spring(0.75)
		time: 0.3
		
reportButton.visible = true
reportButtonText = new TextLayer
	text: "REPORT STRESSFUL AREA"
	x: 245
	color: "rgba(251,245,34,1)"
	fontSize: 42
	fontWeight: 500
	fontFamily: "Roboto"
	letterSpacing: 1.5
	superLayer: reportButton
	y: 68

# reportButton.onMouseDown (event, layer) ->
# 	reportButton.animate "tap"
# 	reportButtonClick.animate "tap"
# 
# reportButton.onMouseUp (event, layer) ->
# 	reportButton.animate "default"
# 	reportButtonClick.animate "default"

reportButton.onTapStart (event, layer) ->
	reportButton.animate "tap"
	reportButtonClick.animate "tap"
	Utils.delay 3.0, ->
		reportButton.animate "default"
		reportButtonClick.animate "default"
		
	

# ONBOARDING ANIMATION
# 

sketch5.onboardingBackgroundPreview.visible = false

onboardingBackground = new Layer
	superLayer: sketch5.onboardingBackgroundPlaceholder
	width: 2184
	height: 2184
	backgroundColor: "rgba(251,245,34,1)"
	y: -767
	borderRadius: 2184
	x: -552
	scale: 0.03
	opacity: 0.00
	
onboardingBackground.states.hide =
	y: -767
	x: -552
	scale: 0.03
	opacity: 0.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6

onboardingBackground.states.show =
	y: -1392
	x: -684
	scale: 1.0
	opacity: 1.00
	shadowSpread: 1
	shadowColor: "rgba(0,0,0,0.24)"
	shadowBlur: 24
	shadowY: 24
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6

onboardingBackgroundIconAnimation = new Layer
	backgroundColor: "rgba(255,255,255,1)"
	opacity: 0.0
	y: 172
	x: 406
	width: 270
	height: 270
	superLayer: sketch5.onboardingBackgroundPlaceholder
	borderRadius: 200
	scale: 1
	
onboardingBackgroundIconAnimationPulse = new Animation onboardingBackgroundIconAnimation,
	opacity: 0.00
	scale: 2.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6
		delay: 2.4

onboardingBackgroundIconAnimationPulsecCount = 0;
onboardingBackgroundIconAnimationPulse.on Events.AnimationEnd, ->
	if (onboardingBackgroundIconAnimationPulsecCount++ < 3)
		onboardingBackgroundIconAnimation.scale = 1
		onboardingBackgroundIconAnimation.opacity = 1
		onboardingBackgroundIconAnimationPulse.start()
	
	
onboardingBackgroundIcon = new Layer
	backgroundColor: "rgba(255,255,255,1)"
	opacity: 0.0
	y: 172
	x: 406
	width: 270
	height: 270
	superLayer: sketch5.onboardingBackgroundPlaceholder
	borderRadius: 200
	scale: 1.0
	

onboardingBackgroundIcon.states.show =
	scale: 1.00
	opacity: 1.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6
		
onboardingBackgroundIcon.states.hide =
	scale: 0.01
	opacity: 0.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.6


sketch5.onboardingText.states.hide =
	opacity: 0.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.3
	
sketch5.onboardingText.states.show =
	opacity: 1.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.3
		delay: 0.3

sketch5.onboardingWarningSign.states.hide =
	opacity: 0.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.3
		


# WARINING PULSE
# 
warningAnimationPulse1 = new Animation sketch5.warningAnimation1,
	opacity: 0
	scale: 3.50
	options:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"
		time: 2
		
warningAnimationPulse1.on Events.AnimationEnd, ->
	if(currentState < 3)
		sketch5.warningAnimation1.opacity = 1
		sketch5.warningAnimation1.scale = 1
		warningAnimationPulse1.start()

warningAnimationPulse2 = new Animation sketch5.warningAnimation2,
	opacity: 0
	scale: 3.50
	options:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"
		time: 2
		delay: 1
		
warningAnimationPulse2.on Events.AnimationEnd, ->
	if(currentState < 2)
		sketch5.warningAnimation2.opacity = 1
		sketch5.warningAnimation2.scale = 1
		warningAnimationPulse2.start()

		
sketch5.warningSign.states.hide =
	opacity: 0.00
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"
		time: 0.6

sketch5.mapDetail.superLayer = sketch5.map
sketch5.mapDetail.x = 1286
sketch5.mapDetail.y = 1218
sketch5.mapDetail.scale = 0.07


# MAP
sketch5.mapDetail.states.hide =
	opacity: 0
	
sketch5.mapDetail.states.show =
	opacity: 1
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 0.3
		delay: 1.4

sketch5.map.states.zoomToWarning =
	scale: 14
	x: 20362
	y: 9614
	animationOptions:
		curve: "cubic-bezier(0.4, 0.0, 0.2, 1)"#Spring(0.75)
		time: 2

# BIKE ANIMATION
	

window.addEventListener 'devicemotion', (event) ->
	accX = event.accelerationIncludingGravity.y / 10 
	accY = (event.accelerationIncludingGravity.y - 0.1 )  / 10
	if(accY > 0)
		sketch5.map.y += Math.abs(accY)
	if(sketch5.map.y > -2700 && currentState == 1)
		nextState()
	if(sketch5.map.y > -2280 && currentState == 2)
		nextState()

	return
	
document.onkeydown = (e) ->
	if e.keyCode == 38
		sketch5.map.y += 20	
	if(sketch5.map.y > -2700 && currentState == 1)
		nextState()
	if(sketch5.map.y > -2280 && currentState == 2)
		nextState()
	return

changeState(0) 
				

		