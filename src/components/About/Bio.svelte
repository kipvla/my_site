<script>
  let showButton,
    more,
    music,
    at,
    teaching,
    outreach,
    web,
    photo = false;
  import Carousel from "../Carousel.svelte";
  import { fade, scale } from "svelte/transition";
  import { onMount } from "svelte";
  import { quadOut } from "svelte/easing";
  const showButtons = () => {
    more = !more;
  };
  onMount(() => {
    setTimeout(() => {
      showButton = true;
    }, 1500);
    //   let moreBtn = document.getElementById("more");
    // moreBtn.addEventListener("click", showButtons);
    // if (more) {
    //   moreBtn.innerHTML = "Less";
    // } else {
    //   moreBtn.innerHTML = "More";
    // }
  });

  // onMount(() => {
  //   document
  //     .querySelectorAll(".btn")
  //     .forEach((item) => item.classList.remove("invisible"));
  // });

  // window.addEventListener('load',
  // function() {
  //   document
  //     .querySelectorAll(".btn")
  //     .forEach((item) => item.classList.remove("invisible"));
  // }, false);
</script>

<div class="bio d-flex">
  <div class="container">
    <!-- svelte-ignore a11y-autofocus -->
    <input type="text" autofocus="true" style="display:none" />
    <div
      class="bio-text text-justify clearfix p-3 d-flex flex-column justify-content-between"
    >
      <img
        src="images/KR32-min.jpg"
        class="my-5 shadow"
        id="top-pic"
        alt="Me"
      />

      <figure class="mb-3">
        <figcaption>Bach Violin Sonata</figcaption>
        <!-- svelte-ignore a11y-media-has-caption -->
        <div class="color">
          <audio controls>
            <source src="sounds/STE-027.mp3" type="audio/mp3" />
          </audio>
        </div>
      </figure>

      <p transition:fade={{ duration: 1000 }}>
        Since an early age, I've been driven by curiosity, accountability, and
        service. Through music and academics, I had the opportunity to explore
        them. When I came across Alexander Technique, the approach seemed to
        offer a new definition of complete and healthy. It continues to inform
        everything I do and I welcome you to join my exploration.
      </p>

      {#if showButton}
        <button class="btn my-2" id="more" on:click={showButtons}
          >{#if more}
            Less
          {:else}
            More
          {/if}</button
        >
      {/if}

      {#if more}
        <button
          class="btn bios my-2"
          tabindex="-1"
          on:click={() => (music = !music)}
          in:fade={{ duration: 1000 }}><i class="fas fa-music" /> Music</button
        >

        {#if music}
          <p
            in:fade={{ duration: 1000 }}
            out:scale={{
              duration: 500,
              delay: 0,
              opacity: 0.3,
              start: 0.5,
              easing: quadOut,
            }}
          >
            Spanning performances with the Chicago Symphony and Yo Yo Ma, and in
            locations from Cuba to Carnegie Hall, I have had the fortune to
            perform incredible works with incredible musicians. These
            experiences constantly inspire me.
          </p>

          <a
            class="mb-3"
            href="https://chicago.suntimes.com/2017/6/11/18378502/yo-yo-ma-performs-concert-for-peace-at-st-sabina-church"
            >Performance with Yo-Yo Ma</a
          >
          embedded vid with Tabea
        {/if}

        <button
          class="btn bios my-2"
          on:click={() => (outreach = !outreach)}
          in:fade={{ duration: 1000 }}
          ><i class="fas fa-hands-helping" /> Outreach</button
        >

        {#if outreach}
          <p transition:fade={{ duration: 1000 }}>
            As a fellow at the Civic Orchestra of Chicago and New World
            Symphony, the desire to connect to a more well-rounded life through
            music inspired several initiatives, he designed and led several
            initiatives, from connecting with the farmworkers community in South
            Florida to securing Alexander Technique instruction for colleagues
            in Chicago. In <a
              class="mb-3"
              href="https://rediscoveringmusician.wordpress.com/"
              >The Rediscovering Musician</a
            >, I earned funding for a series of Alexander Technique lessons for
            two Civic Orchestra colleagues from teacher
            <a href="http://lisadeangelis.com/">Lisa DeAngelis</a>, as well as a
            group class and
            <a href="https://rediscoveringmusician.wordpress.com/">blog</a>
            .
          </p>

          <p transition:fade={{ duration: 1000 }}>
            In Miami, I designed and led Farm to Stage, a project solidifying
            the New World Symphony’s relationship with its community in Miami
            through a collaboration with the Farmworker Association of Florida
            in Homestead, Florida. This involved an interactive performance at
            the New World Symphony Center in Miami Beach, and FWAF headquarters
            in Homestead. The next year, I upped the ante to connect to South
            Florida even more by recruiting 16 other New World fellows to join
            for Damas y Caballeros, a project involving weekly Spanish lessons,
            and three community performances in which the fellows spoke in
            Spanish about the music.
          </p>
          <p>Further, I co-produced and co-hosted</p>
          Pics from these projects
        {/if}

        <button
          class="btn bios my-2"
          on:click={() => (at = !at)}
          in:fade={{ duration: 1000 }}
          ><i class="fas fa-walking" /> Alexander Technique</button
        >

        {#if at}
          <div transition:fade={{ duration: 1000 }}>
            <p>
              I maintain a lively discussion with the worldwide Alexander
              Technique community, from attending the 2015 International
              Congress for the AT in Limerick, Ireland on scholarship, to
              participating in the Alexander Technique Science Webinar, led by
              researchers Tim Cacciatore, Patrick Johnson and Rajal Cohen. I
              started a YouTube channel in May 2020 aimed at creating a new
              image of the technique and showing how it can be a part of
              everyone’s lives.
            </p>

            YouTube, pics from Ireland Congress, link to page on AT?

            <img class="img-thumbnail my-4" src="images/REarle.JPG" alt="" />

            <div class="video mb-3">
              <div class="container">
                <div class="row">
                  <div class="col-3" />
                  <div class="col-12 col-md-6">
                    <div class="videos shadow">
                      <iframe
                        class="resp-iframe"
                        title="Gribby"
                        src="https://www.youtube.com/embed/pN1ZA6hWd3s"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                      />
                    </div>
                  </div>
                  <div class="col-3" />
                </div>
              </div>
            </div>
          </div>
        {/if}

        <button
          class="btn bios my-2"
          on:click={() => (web = !web)}
          in:fade={{ duration: 1000 }}
          ><i class="fas fa-laptop-code" /> Web design</button
        >

        {#if web}
          <p transition:fade={{ duration: 1000 }}>
            I have begun acting on a longstanding desire to better understand
            technology's impact on our lives by learning web development. I have
            studied several programming languages and have a regulary updated
            showcase <a href="https://kiprieckenportfolio.netlify.app/"
              >found here</a
            >. I greatly enjoy helping clients find a comfortable internet voice
            with which to project their best selves.
          </p>
        {/if}
        <button
          class="btn bios my-2"
          on:click={() => (photo = !photo)}
          in:fade={{ duration: 1000 }}
          ><i class="fas fa-camera" /> Photography</button
        >

        {#if photo}
          <p transition:fade={{ duration: 1000 }}>Photography stuff.</p>
        {/if}

        <button
          class="btn bios my-2"
          on:click={() => (teaching = !teaching)}
          transition:fade={{ duration: 1000 }}
          ><i class="fas fa-chalkboard-teacher" /> Teaching</button
        >

        {#if teaching}
          Pics from CAYO, MUSAID

          <!-- <div class="mb-3"> -->
          <!-- </div> -->
          <p transition:fade={{ duration: 1000 }}>
            With over 15 years of teaching experience, from beginner to college
            level, I offers violin and viola over Zoom. Every lesson is informed
            by my unique experience with Alexander Technique inspire joy and
            sustainability in my students' playing.
          </p>

          <Carousel />

          <p transition:fade={{ duration: 1000 }}>
            I even took my knowledge of Spanish and traveled to Havana, Cuba
            with Cuban American Youth Orchestra, and El Salvador, San Salvador
            with MUSAID, putting myself for the first time in a Spanish-speaking
            environment in which I taught and mentored students who speak no or
            little English. And it was amazing!
          </p>

          <button class="btn" href="/lessons">Lessons</button>

          <p transition:fade={{ duration: 1000 }}>
            Visit the lessons page to schedule a lesson or
            find out more. I look forward to hearing from you!
          </p>

          <!-- <a href="kip.riecken@gmail.com">kip.riecken@gmail.com</a> -->
          <button class="btn" href="/contact">Contact Kip</button>
        {/if}
      {/if}

      <!-- {/if} -->
    </div>
  </div>
</div>

<style>
  #top-pic {
    width: 30vw;
    align-self: center;
    border: 4px solid black;
    border-radius: 40px;
  }

  .bio-text {
    align-items: center;
  }

  p {
    display: block;
    max-width: 100%;
  }

  @media only screen and (min-width: 769px) {
    .img-thumbnail {
      max-width: 70%;
    }
  }
  i {
    color: black;
    margin: 1rem 0;
  }
</style>
