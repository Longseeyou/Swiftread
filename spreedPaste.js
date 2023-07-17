var button = document.getElementById("spreed-pasted-button");
button.addEventListener("click",function(){
    localStorage.setItem("readText", document.getElementById("paste-textarea").value);
    window.open("index.html", "spreedRead", "height=500,width=1000");
})