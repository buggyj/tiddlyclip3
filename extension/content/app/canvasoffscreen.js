chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == 'CropImage') { 
		var thumbnail = window.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
		var ctx = thumbnail.getContext("2d");
			thumbnail.width = request.w * request.size;
			thumbnail.height = request.h * request.size;
			ctx.scale(request.size, request.size);															
			var image = new Image();
			image.onload = function() {
				//console.log("++++++++drawimage++++++++++", request.h,request.w,request.x0,request.y0);
				ctx.drawImage(image,request.x0,request.y0,request.w,request.h,0, 0, request.w, request.h);
				//Create a data url from the canvas
				var data = thumbnail.toDataURL("image/png");
				sendResponse(data.substring(data.indexOf(',') + 1));
			};

			image.src = request.image;
	
	//sendResponse(request.image);
    return true;
  } else   if (request.action == 'html') { 
	//try {
			var pasteText ;
			var results = [], waitImage = false;
			results.push({fn:"setHtml", val:DOMPurify.sanitize(request.html)});
			sendResponse(results);
		return true;
  }
  else   if (request.action == 'ClipBoardRead') { 
	//try {
			var pasteText ;
			var results = [], waitImage = false;
			results.push({fn:"setHtml", val:DOMPurify.sanitize(request.html)});
			//console.log("+++++++++enter paste+++++");
			pasteText = document.querySelector("#output");
			pasteText.addEventListener('paste', function paste (e) {
				//e.preventDefault();
				pasteText.removeEventListener("paste", paste, false);console.log("remove handle");

				for (const item of e.clipboardData.items) {
					console.log("clipbrd num items:"+e.clipboardData.items.length);
			 
					if (item.type.indexOf("image") !== 0)
					{
						console.log("pasting clip image no image");
						if (e.clipboardData.types.indexOf('text/html') > -1){
							var data = e.clipboardData.getData('text/html');
							var val = DOMPurify.sanitize(data); console.log(data,"==",val);
							results.push({fn:"setClipboardHtml", val:val});
						}
						if (e.clipboardData.types.indexOf('text/plain') > -1)
							results.push({fn:"setClipboardString",val:e.clipboardData.getData('text/plain')});						
					}
				}
				
				for (const item of e.clipboardData.items) {
					console.log("clipbrd num items:"+e.clipboardData.items.length);
			 
					if (item.type.indexOf("image") === 0)
					{
						var blob = item.getAsFile();
						var reader = new FileReader();
						reader.onload = function(event) {
							console.log("image data",event.target.result.substring(0,22));
							 results.push({fn:"setCBImage",val:event.target.result.substring(22)});
							 sendResponse(results);
						};	
						reader.readAsDataURL(blob);
						waitImage = true;
					}
				}
	
				if (waitImage === false) sendResponse(results);
			});
			//console.log("+++++++before paste+++++++++++");
			pasteText.select();
			document.execCommand("paste");
			//console.log("+++++++after paste+++++++++++");
		//} catch (e) {console.log(e);}
		return true;
  }

}); 