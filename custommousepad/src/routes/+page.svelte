<script>
    import { onMount } from 'svelte';
    import loadinggif from '../static/whiteloading.gif'

    export let dimensions = [];
    export let price = [];

    let loading = true;

    let url = 'https://script.google.com/macros/s/AKfycbzMMC3KlFiKFE_MeFrCnvlbrDG9LInsP1feHtYgI8oqYzH0lNDOJdN9ZsUK9CyeuByD/exec'

    async function sheet() {
        let response = await fetch(url)
        let data = await response.json()
        dimensions = data.dim
        price = data.price
        loading = !loading
    }

    onMount(async () => {
        await sheet();
    });
    
    function goodSize(dimxdim, detail){
        let width = dimxdim.split('x')[0]
        let height = dimxdim.split('x')[1]
        let ratio = width/height
        //console.log("width : "+width+" height : "+height+" ratio : "+ratio)

        if(detail == "width"){
            return 120*ratio
        }
        else if(detail == "height"){
            return 120
        }
        
        // dim.split('x')[0]
    }
    // console.log(price[dimensions.indexOf(dim)])
    
</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat">







<div class="main">
    <h1 class="title">Créer votre tapis de souris personnalisé</h1>
    {#if loading}
    <div class="loadingio-spinner-rolling-76ebn6xgn0p"><div class="ldio-hor4txp16sf">
        <div></div>
        </div></div>
    {:else}
    <div class="grid">
        {#each dimensions as dim (dim)}
            <div class="product">
                <a class="link" href={`./${dim}`}>
                    <div class="productImg">
                        <div class="productSize" style="width: {goodSize(dim, "width")}px; height:{goodSize(dim, "height")}px;">
                            <p class="textWidth">{dim.split('x')[0]} cm</p>
                            <p class="textHeight">{dim.split('x')[1]} cm</p>
                        </div>
                        <!-- <p class="textHeight">{dim.split('x')[1]} cm</p> -->
                    </div>
                </a>
                <a class="productTitle" href={`./${dim}`}>Tapis de souris {dim}cm</a>
                <p class="price">{price[dimensions.indexOf(dim)]} €</p>
            </div>
        {/each}
    </div>
    {/if}
</div>



<style>
@keyframes ldio-hor4txp16sf {
  0% { transform: translate(-50%,-50%) rotate(0deg); }
  100% { transform: translate(-50%,-50%) rotate(360deg); }
}
.ldio-hor4txp16sf div {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 6px solid #e2e6ea;
  border-top-color: transparent;
  border-radius: 50%;
}
.ldio-hor4txp16sf div {
  animation: ldio-hor4txp16sf 1s linear infinite;
  top: 100px;
  left: 100px
}
.loadingio-spinner-rolling-76ebn6xgn0p {
  width: 200px;
  height: 200px;
  display: inline-block;
  overflow: hidden;
  background: rgba(255, 255, 255, 0);
}
.ldio-hor4txp16sf {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0; /* see note above */
}
.ldio-hor4txp16sf div { box-sizing: content-box; }

a{
    text-decoration: none;
}
*{
    padding: 0px;
    margin: 0px;
    font-family: 'Montserrat', sans-serif;
}

:global(body){
    width: 100%;
    height: 100%;
    background: linear-gradient(rgb(54, 54, 54), rgb(32, 32, 32));
    background-attachment: fixed;
    
}
.main{
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    width: 100%;
}
.grid{
    width: 90%;
    display: grid;
    grid-template-columns: 33% 33% 33%;
    gap: 20px 0px;
}
.product{
    display: flex;
    flex-direction: column;
    align-items: center;
}
.productImg{
    background-color: rgb(227, 231, 235);
    width: 400px;
    height: 200px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    border: 3px solid #cacaca;
    box-sizing: border-box;
}
.textHeight{
    color: rgb(0, 0, 0);
    writing-mode: vertical-rl;
    margin-left: 102%;
    margin-top: -104px;
}
.textWidth{
    color: rgb(0, 0, 0);
    padding-top: 120px;
}
.productSize{
    background-color: rgb(240, 240, 240);
    border-radius: 8px;
    box-shadow: 0px 0px 20px rgb(156, 156, 156);
    border: solid #cacaca 3px;
    box-sizing: border-box;
    text-align: center;
    justify-content: center;
    transition: all ease-out 0.2s;
}
.productImg:hover > .productSize{
    transition: all ease-out 0.4s;
    scale: 1.07;
}
.productTitle{
    text-decoration: none;
    color: white;
    font-size: 1.2rem;
    text-align: center;
}
.price{
    color: white
}
.title{
    color: white;
    margin: 20px 0px 30px 0px;
    text-align: center;
}



@media screen and (max-width: 1430px) {
    .grid{
        width: 90%;
        display: grid;
        grid-template-columns: 50% 50%;
        gap: 20px 0px;
    }
}
@media screen and (max-width: 960px) {
    .grid{
        width: 90%;
        display: grid;
        grid-template-columns: 100%;
        gap: 20px 0px;
    }
}
@media screen and (max-width: 650px) {
    .title{
        font-size: 1.5rem;
    }
}
@media screen and (max-width: 470px) {
    .title{
        margin: 10px 0px 15px 0px;
    }
    .productImg{
        background-color: rgb(227, 231, 235);
        width: 100%;
        height: 180px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        border-radius: 10px;
        border: 3px solid #cacaca;
        box-sizing: border-box;
    }
    .product{
        width: 100%;
        margin-bottom: 15px; 
    }
    .link{
        width: 90%;
    }
    .grid{
        gap: 0px;
    }
}
</style>

