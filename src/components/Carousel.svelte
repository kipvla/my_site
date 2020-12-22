<style>
    .carousel-item {
  height: 32rem;
  background:black;
  position: relative;
  background-position: center;
  background-size: cover;
}

@media only screen and (max-width: 768px) {
    .carousel-item {
  height: 16rem;
    }
}

/* .car-overlay {
  background-color: rgba(240, 243, 245, 0.4);
  margin-bottom: 6rem;
}

.container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: 50px;
}
.overlay-image {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  background-position: center center;
  background-size: cover;
  opacity: 0.7;
} */
</style>


<div id="carouselExampleIndicators" class="carousel slide shadow mb-3" data-ride="carousel">
    <ol class="carousel-indicators">
      <li data-target="#carouselExampleIndicators" data-slide-to="0" class="active"></li>
      <li data-target="#carouselExampleIndicators" data-slide-to="1"></li>
      <li data-target="#carouselExampleIndicators" data-slide-to="2"></li>
    </ol>
    <div class="carousel-inner">
      <div class="carousel-item active">
        <img class="d-block w-100" src="images/renato-student.jpg" alt="First slide">
      </div>
      <div class="carousel-item">
        <img class="d-block w-100" src="images/jimross.jpg" alt="Second slide">
      </div>
      <div class="carousel-item">
        <img class="d-block w-100" src="images/laughing.jpg" alt="Third slide">
      </div>
    </div>
    <a class="carousel-control-prev" href="#carouselExampleIndicators" role="button" data-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="carousel-control-next" href="#carouselExampleIndicators" role="button" data-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="sr-only">Next</span>
    </a>
  </div>

<!-- <div id="myCarousel" class="carousel slide carousel-fade" data-ride="carousel">
    <ol class="carousel-indicators">
        <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
        <li data-target="#myCarousel" data-slide-to="1"></li>
        <li data-target="#myCarousel" data-slide-to="2"></li>
    </ol>
    <div class="carousel-inner">
        <div class="carousel-item active" data-interval="8000">
            <div class="overlay-image" id="car1" style="background-image: url('images/renato-student.jpg');"></div>
            <div class="container car-overlay">
            </div>
        </div>
        <div class="carousel-item" data-interval="8000">
            <div class="overlay-image" id="car2" style="background-image: url('images/jimross.jpg');"></div>
            <div class="container car-overlay">
            </div>
        </div>
        <div class="carousel-item" data-interval="8000">
            <div class="overlay-image" id="car3" style="background-image: url('images/laughing.jpg');"></div>
            <div class="container car-overlay">
            </div>
        </div>
    </div>
    <a href="#myCarousel" class="carousel-control-prev" role="button" data-slide="prev">
        <span class="sr-only">Previous</span>
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    </a>
    <a href="#myCarousel" class="carousel-control-next" role="button" data-slide="next">
        <span class="sr-only">Next</span>
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
    </a>
  </div> -->

<!-- <script>
    import Carousel from '@beyonk/svelte-carousel'
	import { ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons'
</script>

<style>
    .control :global(svg) {
		width: 100%;
		height: 100%;
		color: #fff;
		border: 2px solid #fff;
		border-radius: 32px;
    }
    
    .slide-content {
        height: 50vh;
        width: auto;
    }

    div > img {
        height: auto;
        width:100%;
    }
</style>

<Carousel>
    <span class="control" slot="left-control">
      <ChevronLeftIcon />
    </span>
    <div class="slide-content"><img src="images/KR11.jpg" alt=""></div>
    <div class="slide-content"><img src="images/KR12.jpg" alt=""></div>
    <span class="control" slot="right-control">
      <ChevronRightIcon />
    </span>
  </Carousel> -->