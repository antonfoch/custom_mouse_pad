<script>
    import { onMount, onDestroy } from 'svelte';
    import { fabric } from 'fabric';
    import { goto } from '$app/navigation';
    import { writable, get } from 'svelte/store';
    import { page } from '$app/stores';
    import { slide, fly  } from 'svelte/transition';
    import addicon from '../../static/addimg.png'
    import addtxticon from '../../static/addtxt.png'
    import drawicon from '../../static/draw.png'
    import trashicon from '../../static/trash.png'
    import downloadicon from '../../static/download.png'
    import deleteicon from '../../static/delete.png'
    import texticon from '../../static/text.png'
    import boldicon from '../../static/bold.png'
    import bringfront from '../../static/bringfront.png'
    import loading from '../../static/loading.gif'
	import { navigate } from 'jsdom/lib/jsdom/living/window/navigation';
    // import dimensions from '../+page.svelte'

    export let data;
    let productDimension = $page.params.productId
    let [canvaDimWidth, canvaDimHeight] = productDimension.split('x').map(Number);

    let isValidDimension;
    let resizeObserver;
    let originalRatio;
    let canvas;
    let fabricCanvas;
    let imageFile;
    let textContent = '';
    let textObject;
    let fontSelection = '';
    let textColor = '#000000';
    let isDrawingMode = false;
    let strokeColor = '#000000';
    let strokeWidth = 1;
    let isDownloading = false;
    let fileInput;
    let canvasObjects = writable({});
    let fontList = []
    let showTextSettings = false;
    let showElementlist = false;

    
    onMount(async() => {
        const resDim = await fetch('https://script.google.com/macros/s/AKfycbzMMC3KlFiKFE_MeFrCnvlbrDG9LInsP1feHtYgI8oqYzH0lNDOJdN9ZsUK9CyeuByD/exec');
        const dim = await resDim.json();
        isValidDimension = dim.dim.includes($page.params.productId);
        console.log(isValidDimension)
        if (!isValidDimension) {
            goto("/error")
        }
        // console.log(dimensions)
        fontList = await fetchFonts();
        fabricCanvas = new fabric.Canvas('mousepadCanvas', { preserveObjectStacking: true });

        fabricCanvas.on('after:render', function() {
            if (!isDownloading) {
            fabricCanvas.contextContainer.strokeStyle = 'rgb(255, 160, 160)';
            fabricCanvas.contextContainer.lineWidth = 2;
            fabricCanvas.contextContainer.strokeRect(25, 25, canvaDimWidth - 51, canvaDimHeight - 51);
        }
        });
        
        fabricCanvas.on('object:added', function (event) {
                let element = event.target;
                element.uniqueId = Math.random().toString(36).substring(2); 
                canvasObjects.update(elements => {
                elements[element.uniqueId] = element;
                return elements;
            });
        });

        fabricCanvas.on('object:removed', function (event) {
                canvasObjects.update(elements => {
                delete elements[event.target.uniqueId];
                return elements;
            });
        });

        fabricCanvas.on('object:modified', function (event) {
            let element = event.target;
            if (element.type === 'i-text') {
                canvasObjects.update(elements => {
                    elements[element.uniqueId] = element;
                    return elements;
                });
            }
        });

        fabricCanvas.on('selection:created', function(event) {
            let selectedObject = fabricCanvas.getActiveObject();
            if (selectedObject.type === 'i-text') {
                showTextSettings = true; // Afficher les paramètres du texte
                fabricCanvas.isDrawingMode = false; // Assurer que le mode dessin est désactivé
            } else {
                showTextSettings = false;
            }
        });

        if (typeof window !== 'undefined' ) {
            toggleDrawingModeOnClickOutside();
        }

        if (typeof window !== 'undefined') {
            originalRatio = canvaDimWidth / canvaDimHeight;
            canvaDimHeight = window.innerHeight * 0.6; // 60% de la hauteur de la fenêtre
            canvaDimWidth = canvaDimHeight * originalRatio; // hauteur ajustée
            fabricCanvas.setWidth(canvaDimWidth); // ajuste la largeur du canevas
            fabricCanvas.setHeight(canvaDimHeight); // ajuste la hauteur du canevas
        }
        fabricCanvas.renderAll();

        window.addEventListener('resize', setCanvaSize);        
});
function setCanvaSize(){
    if(window.innerWidth < 1050) {
        fabricCanvas.setWidth(window.innerWidth - 20);
        fabricCanvas.setHeight(window.innerWidth / originalRatio - 20);

        fabricCanvas.on('after:render', function() {
            if (!isDownloading) {
                fabricCanvas.contextContainer.strokeStyle = 'rgb(255, 160, 160)';
                fabricCanvas.contextContainer.lineWidth = 2;
                fabricCanvas.contextContainer.clearRect(25, 25, fabricCanvas.getWidth() - 51, fabricCanvas.getHeight() - 51);
                fabricCanvas.contextContainer.strokeRect(25, 25, fabricCanvas.getWidth() - 51, fabricCanvas.getHeight() - 51);
            }
        });
        fabricCanvas.renderAll();
    }
}
onDestroy(() => {
    if (resizeObserver) {
        resizeObserver.unobserve(document.body);
    }
});


function toggleDrawingModeOnClickOutside() {
    window.addEventListener('click', (e) => {
        if (e.target.nodeName === 'CANVAS' || e.target.closest('.settings-container')|| e.target.closest('.element-list') || e.target.closest('.button-container')) {
            // Clicked inside the canvas, do nothing
            return;
        } 
        if (isDrawingMode) {
            // Clicked outside the canvas and drawing mode is on, toggle it off
            toggleDrawingMode();
        }
    });
}

    function updateFont() {
    let activeTextObject = fabricCanvas.getActiveObject();
    if (activeTextObject) {
        WebFont.load({
            google: {
                families: [fontSelection]
            },
            active: function() {
                activeTextObject.set({ fontFamily: fontSelection });
                fabricCanvas.requestRenderAll();
            },
            inactive: function() {
                console.log("The font could not be loaded.");
            }
        });
    }
}
    async function fetchFonts() {
        return data.items.map((font) => font.family);
    }

    function openFilePicker() {
        fileInput.click(); 
    }

   
    function addImage() {
        isDrawingMode = false;
        fabricCanvas.isDrawingMode = isDrawingMode;

        let reader = new FileReader();
        reader.onload = function (event) {
            fabric.Image.fromURL(event.target.result, function(img) {
            let scaleFactor = Math.min((canvaDimWidth - 50) / img.width, (canvaDimHeight - 50) / img.height);
            img.scale(scaleFactor);
            fabricCanvas.add(img);
                
            });
        };
        reader.readAsDataURL(imageFile[0]); 
        fileInput.value = null;
    }

    function handleFileChange() {
        imageFile = fileInput.files;
        addImage();
    }


    function addText() {
        isDrawingMode = false;
        showElementlist = false;
        fabricCanvas.isDrawingMode = isDrawingMode;
        showTextSettings = true;
        let existingTextObject = fabricCanvas.getObjects('text').find(obj => obj.text === textContent);
        if (existingTextObject) {
            existingTextObject.set({ fontFamily: fontSelection, fill: textColor });
        } else {
            textObject = new fabric.IText(textContent, { left: 10, top: 10, fontFamily: fontSelection, fill: textColor });
            fabricCanvas.add(textObject);
        }
        fabricCanvas.bringToFront(textObject);
        fabricCanvas.renderAll();
    }

   


    function downloadCanvas() {
        isDownloading = true;
        fabricCanvas.discardActiveObject().renderAll();
        let link = document.createElement('a');
        link.download = `${productDimension}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setTimeout(() => {
        isDownloading = false;
        fabricCanvas.requestRenderAll();  
        }, 100);
    }

    function toggleDrawingMode() {
        isDrawingMode = !isDrawingMode;
        fabricCanvas.isDrawingMode = isDrawingMode;
        fabricCanvas.freeDrawingBrush.color = strokeColor;
        fabricCanvas.freeDrawingBrush.width = strokeWidth;
        showTextSettings = false;
    }


    function updateStrokeColor() {
        if (fabricCanvas.isDrawingMode) {
            fabricCanvas.freeDrawingBrush.color = strokeColor;
        }
    }

    function updateStrokeWidth() {
        if (fabricCanvas.isDrawingMode) {
            fabricCanvas.freeDrawingBrush.width = strokeWidth;
        }
    }

    function removeActiveObject() {
        const selectedObjects = fabricCanvas.getActiveObjects();
        for (let object of selectedObjects) {
            if (object === textObject) {
                textObject = null;
            }
           
            fabricCanvas.remove(object);
        }
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
    }

    function removeElement(uniqueId) {
        let objectToRemove = fabricCanvas.getObjects().find(obj => obj.uniqueId === uniqueId);

        if (objectToRemove) {
            if (objectToRemove === textObject) {
                textObject = null;
            }

            fabricCanvas.remove(objectToRemove);
            fabricCanvas.requestRenderAll();
        }

    }
    function toggleBold() {
    let activeTextObject = fabricCanvas.getActiveObject();
        if (activeTextObject) {
            let isBold = (activeTextObject.fontWeight === 'bold');
            activeTextObject.set({ fontWeight: isBold ? 'normal' : 'bold' });
            fabricCanvas.renderAll();
        }
    }
    function updateColor() {
        let activeTextObject = fabricCanvas.getActiveObject();
        if (activeTextObject) {
            activeTextObject.set({ fill: textColor });
            fabricCanvas.renderAll();
        }
    }

    function selectCanvasElement(uniqueId) {
        let objectToSelect = fabricCanvas.getObjects().find(obj => obj.uniqueId === uniqueId);
        if (objectToSelect) {
            fabricCanvas.setActiveObject(objectToSelect);
            fabricCanvas.bringToFront(objectToSelect)
            fabricCanvas.renderAll();
        }
    }


    function toggleTextSettings() {
        isDrawingMode = false;
        fabricCanvas.isDrawingMode = isDrawingMode; 
        showTextSettings = !showTextSettings;
        
    }


    
</script>

<div class="main">

    <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"></script>
    <!-- <h1 class="title">Dimension du produit : {productDimension}</h1> -->
    
    <div class="container">
        <div class="element-list">
            <h2 class="listTitle">Éléments du canvas</h2>
            <div class="list">
                {#each Object.values($canvasObjects) as element, index (element.uniqueId)}
                <div class="element-container">
                    <span class="element-text">{index + 1}: {(element.type == 'i-text') ? element.text : element.type}</span>
                    <div class="buttons-container">
                        <button on:click={() => selectCanvasElement(element.uniqueId)}>
                            <img src={bringfront} alt="bringfront">
                        </button>
                        <button class="mini-delete" on:click={() => removeElement(element.uniqueId)}>
                        <img src={deleteicon} alt="delete">
                        </button>
                    </div>
                </div>
                {/each}
            </div>
            <div class="footer">
                <p><a class="footerElements" href="https://www.pinea.be/" target="_blank">© 2022 PINEA</a></p>
                <p><a class="footerElements" href="https://www.pinea.be/mentions-legales" target="_blank">Mentions légales</a></p>
                <p><a class="footerElements" href="https://www.pinea.be/politique-de-confidentialite" target="_blank">Politique de Confidentialité</a></p>
                <p><a class="footerElements" href="https://www.pinea.be/cgv-gvu" target="_blank">CGV et CGU</a></p>
                <p><a class="footerElements" href="https://www.pinea.be/droit-de-retractation" target="_blank">Droit de rétractation</a></p>
            </div>
        </div>


        <div class="settingsCanva">
            <div class="controls-container">
                <div class="button-container">
                    <div class="leftside">
                        <input type="file" bind:this={fileInput} on:change={handleFileChange} style="display: none;" />
                        <button on:click={openFilePicker}><img src={addicon} alt="AddImage"/></button>
                        <button class:text-active={showTextSettings} on:click={toggleTextSettings}><img src={texticon} alt="addtxt"></button>                 
                        <button class:drawing-active={isDrawingMode} on:click|stopPropagation={toggleDrawingMode}> <img src={drawicon} alt="draw"></button>
                        <button on:click={removeActiveObject}><img src={trashicon} alt="delete"></button>
                    </div>
                    <div class="rightside">
                        <button class="downloadbutton" on:click={downloadCanvas}><span class="download-text">Télécharger</span><img src={downloadicon} alt="download"></button>
                    </div>
                </div>
                
                <div class="settings-container">
                    {#if showTextSettings}
                        <div class="text-params" transition:slide="{{ y: 100, duration: 200 }}">
                            <div class="input-wrapper1">
                                <input class="btnInput" placeholder="Votre texte" type="text" bind:value={textContent} />
                                <button class="btnText" on:click={addText}><img class="addtxtimg" src={addtxticon} alt="add text icon"></button>
                            </div>
                            
                            <div class="textsettings">
                                <select id="font-selection" bind:value={fontSelection} on:change="{updateFont}">
                                    <option disabled={fontSelection !== ''} selected={fontSelection === ''} hidden value="">Choisissez une police...</option>
                                    {#each fontList as font (font)}
                                        <option value={font}>{font}</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="textsettings">
                                <input class="btnColor" type="color" bind:value={textColor} on:change={updateColor}>
                            </div>
                            <div class="textsettings">
                                <button class="btnbold" on:click={toggleBold}><img class="bold" src={boldicon} alt="bold"></button>
                            </div>
                        </div>
                    {/if}
                    {#if isDrawingMode}
                        <div class="draw-params" transition:slide="{{ y: 100, duration: 200 }}">
                            <span class="input-wrapper">
                                <button class="decrease" on:click={() => { strokeWidth = Math.max(0, strokeWidth - 1); updateStrokeWidth(); }}>-</button>
                                <input id="quantity" class="btnInputDraw" type="number" bind:value={strokeWidth} on:input={e => { strokeWidth = isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber; updateStrokeWidth(); }} />
                                <button class="increase" on:click={() => { strokeWidth = strokeWidth + 1; updateStrokeWidth(); }}>+</button>
                            </span>
                            
                            <div class="strokesettings">
                                <input  type="color" id="stroke-color" bind:value={strokeColor} on:input={updateStrokeColor} />
                            </div>
                        </div>
                    {/if}     
                </div>
            </div>
            
            <div class="canvas-container">
                {#if isValidDimension}
                <canvas bind:this={canvas} id="mousepadCanvas" width="{canvaDimWidth}" height="{canvaDimHeight}"></canvas>
                {:else}
                <div class="loadingio-spinner-rolling-v7w5a90xxs"><div class="ldio-y3g2nojuw7">
                    <div></div>
                    </div></div>
                {/if}
            </div>
        </div>
    </div>

</div>


<style>

.main { 
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background-color: #d2d2d3;
    background-size: cover; 
    background-repeat: no-repeat; 
    background-position: center; 
}

.container{
    display: flex;
    flex-direction: row;
    height: 100%;
}

button {
    border: none;
    background: none;
    transition: background-color 0.3s ease;
    border-radius: 8px;
    padding: 5px;
    width: 40px;
    height: 40px;
}

button:hover {
    background-color: rgb(83, 83, 83);
    border-radius: 8px;
}

img {
    width: 30px;
}

::-webkit-scrollbar {
    width: 10px; 
}

::-webkit-scrollbar-thumb {
    background: #888; 
    border-radius: 5px; 
}

::-webkit-scrollbar-thumb:hover {
    background: #555; 
}

p {
    font-family:  'Montserrat', sans-serif;
}

.footerElements:hover {
    color: #377fc2;
}

/* ========== LOADING STYLES ========== */
@keyframes ldio-y3g2nojuw7 {
  0% { transform: translate(-50%,-50%) rotate(0deg); }
  100% { transform: translate(-50%,-50%) rotate(360deg); }
}
.ldio-y3g2nojuw7 div {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 6px solid #2e2e2e;
  border-top-color: transparent;
  border-radius: 50%;
}
.ldio-y3g2nojuw7 div {
  animation: ldio-y3g2nojuw7 1s linear infinite;
  top: 100px;
  left: 100px
}
.loadingio-spinner-rolling-v7w5a90xxs {
  width: 200px;
  height: 200px;
  display: inline-block;
  overflow: hidden;
  background: rgba(255, 255, 255, 0);
}
.ldio-y3g2nojuw7 {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0; /* see note above */
}
.ldio-y3g2nojuw7 div { box-sizing: content-box; }

/* ========== BUTTON CONTAINER ========== */
.button-container {
    position: relative; 
    display: flex;
    justify-content: space-between;
    padding: 10px 0px 8px 10px;
    background-color: #2e2e2e;
    box-shadow: rgba(46, 46, 46, 0.15) 10px 10px 10px;
}

.button-container::before {
    content: '';
    position: absolute;
    top: 25%; 
    bottom: 25%;
    left: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.151);
    width: 0;
}



.leftside {
    display: flex;
    gap: 20px;
}

.downloadbutton {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2e2e2e;
    border-radius: 8px;
    border: none;
    padding: 5px;
    width: 170px;
    height: 40px;
    margin-right: 10px;
}

.downloadbutton:hover {
    background-color: rgb(83, 83, 83);
    border-radius: 8px;
}

.download-text {
    color: white;
    font-size: 20px;
    font-weight: bold;
    margin-right: 10px;
}

.drawing-active {
    background-color: rgb(119, 119, 119);
}

.text-active {
    background-color: rgb(119, 119, 119);
}

.settingsCanva{
    display: flex;
    flex-direction: column;
    width: 85%;
}

.settings-container {
    margin: 10px 0px 0px 10px;
    height: 70px;
}

.text-params, .draw-params {
    background-color: #575757;
    border-radius: 8px;
    padding: 10px;
    width: fit-content;   
    display: flex;
    align-items: center ;
}


.btnInput {
    height: 40px;
    box-sizing: border-box;
    border: 1px solid #727272;
    border-radius: 4px;
    font-size: 16px;
    background-color: #ececec;
    color: #141414;
    padding-left: 10px;
    padding-right: 40px;
}

.btnInput::placeholder {
    color: #6e6e6e;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
}

.btnInput:focus {
    outline:none;
}


.btnText { 
    position: absolute;
    right: 0;
    top: 0;
    border: none;
    background: none;
    transition: background-color 0.3s ease;
    border-radius: 0px;
    padding: 5px;
    width: 40px;
    height: 40px;
}

.btnText:hover {
    background-color: rgb(209, 207, 207);
    border-radius: 0px;
}

.btnColor{
    height: 40px;
    width: 40px;
    border: #cecece;
    border-radius: 5px;
}


.input-wrapper1 {
    position: relative;
}

.btnInput {
    border: none;
    /* autres styles */
}

/* ========== Input Number ========== */

.input-wrapper {
  width: 150px;
  display: flex;
  border-radius: 50%;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

input[type="number"] {
  /* -moz-appearance: textfield; */
  padding: 10px;
  text-align: center;
}

.input-wrapper * {
  border: none;
  width: 50px;
  flex: 1;
}

.input-wrapper button {
  cursor: pointer;
}

.input-wrapper button:first-child {
  border-radius: 50% 0 0 50%;
  font-size: larger;
}

.input-wrapper button:last-child {
  border-radius: 0 50% 50% 0;
  font-size: larger;
}

.increase {
    background-color: #fff;
    border: 1px solid #ccc;
    border-right: none;
    margin-right: 10px;
}

.increase:hover {
    background-color: #e1e1e1;
}

.decrease {
    background-color: #fff;
    border: 1px solid #ccc;
    border-left: none;
}

.decrease:hover {
    background-color: #e1e1e1;
}

#quantity {
    border: 1px solid #ccc;
    border-left: none;
    border-right: none;
    font-size: 16px;
    padding: 5px 10px;
    width: 100%;
    text-align: center;
}

#quantity:focus {
    outline: none;
}

/* ========== MAIN CONTAINER ========== */






/* ========== CANVAS ========== */
.canvas-container{
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 5em;
}

#mousepadCanvas {
    background-color: rgb(255, 255, 255);
    background-image: linear-gradient(0deg, transparent 24px, rgba(255, 255, 255, 0.05) 25px, rgba(0,0,0,.05) 26px, transparent 27px, transparent 49px, rgba(0,0,0,.05) 50px, rgba(0,0,0,.05) 51px, transparent 52px),
                      linear-gradient(90deg, transparent 24px, rgba(0,0,0,.05) 25px, rgba(0,0,0,.05) 26px, transparent 27px, transparent 49px, rgba(0,0,0,.05) 50px, rgba(0,0,0,.05) 51px, transparent 52px);
    background-size: 50px 50px;
    border-radius: 20px;
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}



/* ========== ELEMENT LIST ========== */
.element-list{
    background-color: #2e2e2e;
    height: 100%;
    width: 15%;
    box-shadow: rgba(46, 46, 46, 0.15) 10px 10px 10px;
    position: relative;
}

.list{
    column-count: auto; 
    column-gap: 20px; 
    height: 90vh;
    overflow: auto; 
}

.listTitle{
    font-family: 'Montserrat', sans-serif;
    color: #ffffff;
    margin: 0;
    text-align: center;
    margin-top: 17px;
    margin-bottom: 7px;
}

.element-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    margin: 5px 15px;
    background-color: #4e4e4e;
    border-radius: 8px;
    box-shadow: rgba(255, 254, 254, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;
}

.buttons-container {
    display: flex;
    gap: 10px;
}

.element-container .element-text {
    font-family: 'Montserrat', sans-serif;
    color: #ffffff;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.element-container button {
    background-color: #686969;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.element-container button:hover {
    background-color: #5a6268;
}

.mini-delete {
    font-size: 0.8em;
    padding: 5px;
    margin-left: 10px;
}

.footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    text-align: center;
    background: #2e2e2e;
    color: #fff;
    padding: 10px 0;
}

.footer a {
    color: #fff;
    text-decoration: none;
}


#font-selection {
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    background-color: #ececec;
    color: #6e6e6e;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #a3a3a3;
    width: 200px;
    margin-left: 5px;
    margin-right: 5px;
}

#font-selection:focus {
    outline:none;
}

@media (max-width: 1170px) {
    .main { 
        display: flex;
        flex-direction: column;
        height: auto;
        width: 100%;
        background-color: #d2d2d3;
        background-size: cover; 
        background-repeat: no-repeat; 
        background-position: center; 
    }
    .container{
        display: flex;
        flex-direction: column-reverse;
    }
    .settingsCanva{
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .canvas-container{
        display: flex;
        justify-content: center;
        margin: 10px 0px 15px 0px;
    }
    #mousepadCanvas {
        background-color: rgb(255, 255, 255);
        background-image: linear-gradient(0deg, transparent 24px, rgba(255, 255, 255, 0.05) 25px, rgba(0,0,0,.05) 26px, transparent 27px, transparent 49px, rgba(0,0,0,.05) 50px, rgba(0,0,0,.05) 51px, transparent 52px),
                      linear-gradient(90deg, transparent 24px, rgba(0,0,0,.05) 25px, rgba(0,0,0,.05) 26px, transparent 27px, transparent 49px, rgba(0,0,0,.05) 50px, rgba(0,0,0,.05) 51px, transparent 52px);
        background-size: 50px 50px;
        border-radius: 20px;
        box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
    }
    .button-container::before {
        display: none;
    }
    .element-list{
        background-color: #2e2e2e;
        width: 100%;
        box-shadow: rgba(46, 46, 46, 0.15) 10px 10px 10px;
    }
    .list{
        column-count: auto; 
        column-gap: 20px; 
        min-height: 50vh;
        height: auto;
        overflow: auto; 
    }
    .footer{
        position: relative;
        bottom: 0px;
    }

}
@media (max-width: 750px) {
    .leftside button{
        width: 30px;
        height: 30px;
    }
    .button-container img{
        width: 25px;
    }
    .rightside button{
        /* background-color: #377fc2; */
        width: 30px;
        height: 30px;
    }
    .download-text{
        display: none;
    }
    .btnInput{
        width: 150px;
    }
    #font-selection{
        width: 100px;
    }
}
</style>
