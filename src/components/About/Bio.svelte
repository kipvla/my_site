<script>
  let less = true;
  let music,
    at,
    teaching,
    outreach,
    web,
    photo = false;
  import Carousel from "../Carousel.svelte";
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";

  onMount(() => {
    document
      .querySelectorAll(".btn")
      .forEach((item) => item.classList.remove("invisible"));
  });

  // window.addEventListener('load',
  // function() {
  //   document.querySelector("#more").classList.remove("invisible");
  // }, false);
</script>

<div class="bio d-flex">
  <div class="container">
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
          From an early age, Kip’s tireless work ethic has had two drives -
          being accountable and helping others. Through music and academics, he
          explored this accountability and mentorship, regularly leading in a
          way that sought to be fair and responsible. When his path crossed with
          that of Alexander Technique, these ideas seemed to have found a new
          home. When faced with a practice that seemed to offer a new embodied
          way of living and make living easier and more enjoyable, with no
          equipment required but the person he already was, he began a serious
          investigation of what it meant to be complete and healthy. How could
          some things suddenly be easier? Why was that the case, when he had
          always worked so hard? What had he been doing wrong?
        </p>

      <!-- <button class="btn invisible my-2" on:click={() => less = !less}
        ><i class="fas fa-music" /> More</button
      > -->

      <!-- {:else} -->
      <button class="btn invisible my-2" on:click={() => (music = !music)}
        ><i class="fas fa-music" /> Music</button
      >

      {#if music}
      <p transition:fade={{ duration: 1000 }}>
        This discovery pushed him to change his degree midway through college,
        focusing on pre-health, driven by the possibilities he saw in a new
        approach to education. What was behind these new possibilities, and why
        hadn’t he been introduced earlier? Through years, often grueling, of
        self-discovery and exploration, Kip has combined a successful career as
        a professional musician, performing with the Chicago, St. Louis, and New
        World symphonies, performing in places from Cuba and El Salvador to
        Carnegie Hall, and alongside such musicians as Yo-Yo Ma and Tabea
        Zimmerman. as he has continued to live out these ideas of accountability
        and helping others.
      </p>

      <a
      class="mb-3"
      href="https://chicago.suntimes.com/2017/6/11/18378502/yo-yo-ma-performs-concert-for-peace-at-st-sabina-church"
      >Performance with Yo-Yo Ma</a
    >
{/if}


      <button class="btn invisible my-2" on:click={() => outreach = !outreach}
        ><i class="fas fa-hands-helping" /> Outreach</button
      >

      {#if outreach}
      <p transition:fade={{ duration: 1000 }}>
        As a fellow at the Civic Orchestra of Chicago and New World Symphony, he
        designed and led several initiatives aimed at inspiring these ideals of
        accountability and companionship in himself and amongst his colleagues.
        In Chicago, he earned support for The Rediscovering Musician, a project
        bringing Alexander Technique to the Civic Orchestra in the form of a
        series of lessons for two of his colleagues from teacher Lisa DeAngelis,
        as well as a group class and blog.
      </p>


      <a class="mb-3" href="https://rediscoveringmusician.wordpress.com/"
        >Rediscovering Musician</a
      >

      <p transition:fade={{ duration: 1000 }}>
        In Miami, Kip designed and led Farm to Stage, a project solidifying the
        New World Symphony’s relationship with its community in Miami, in Kip’s
        home state of Florida, in which he partnered with the Farmworker
        Association of Florida to connect the migrant farmworkers with the
        symphony through concerts in Miami Beach and Homestead. He also designed
        and led, with the help of 16 other New World fellows, Damas y
        Caballeros, a project to further strengthen the ties of New World
        Symphony with its community. Fellows met weekly for Spanish lessons and
        performed three concerts, in which all musicians spoke in Spanish about
        the music they played, across the greater Miami area.
      </p>
      Pics from these projects      
      {/if}

      <button class="btn invisible my-2" on:click={() => at = !at}
        ><i class="fas fa-walking" /> Alexander Technique</button
      >

      {#if at}
      <p transition:fade={{ duration: 1000 }}>
        Kip has engaged in a lively discussion with the worldwide Alexander
        Technique community, from attending the 2015 International Congress for
        the AT in Limerick, Ireland on scholarship, to participating in the
        Alexander Technique Science Webinar, led by researchers Tim Cacciatore,
        Patrick Johnson and Rajal Cohen. He started a YouTube channel aimed at
        creating a new image of the technique and showing how it can be a part
        of everyone’s lives.
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
      {/if}

      <!-- <p>
        He lives to be challenged, and believes hardships and discomfort, when
        approached healthily, only lead him to be a better person. He lives to
        help others find comfort in themselves and tries to live out this desire
        in all his personal relationships.
      </p> -->

      <button class="btn invisible my-2" on:click={() => web = !web}
        ><i class="fas fa-laptop-code" /> Web design</button
      >

      {#if web}
      <p transition:fade={{ duration: 1000 }}>
        He has also taken the downtime in the pandemic to learn web development,
        learning several programming languages and building a portfolio found
        here. He is creating sites for those who would like them and enjoys the
        process of helping people project their best selves.
      </p>
      {/if}
      <button class="btn invisible my-2" on:click={() => photo = !photo}
        ><i class="fas fa-camera" /> Photography</button
      >

      {#if photo}
      <p transition:fade={{ duration: 1000 }}>
        Photography stuff.
      </p>
      {/if}

      <button class="btn invisible my-2" on:click={() => teaching = !teaching}
        ><i class="fas fa-chalkboard-teacher" /> Teaching</button
      >

      {#if teaching}
      <p transition:fade={{ duration: 1000 }}>
        Speaking of challenges, Kip took his knowledge of Spanish and traveled
        to Havana, Cuba with Cuban American Youth Orchestra, and El Salvador,
        San Salvador with MUSAID, putting himself for the first time in a
        Spanish-speaking environment in which he was tasked with teaching and
        mentoring students who speak none or little English.
      </p>

      Pics from CAYO, MUSAID

      <!-- <div class="mb-3"> -->
      <Carousel />
      <!-- </div> -->
      <p transition:fade={{ duration: 1000 }}>
        With over 15 years of teaching experience, from beginner to college
        level, Kip offers violin and viola over Zoom, including his experience
        with the technique in every lesson to encourage better
        self-understanding and accountability in his students.
      </p>

      <a href="kip.riecken@gmail.com">kip.riecken@gmail.com</a>
      <button class="btn" href="/contact">Contact Kip</button>
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
