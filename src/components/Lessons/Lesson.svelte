<script>
  import { fly } from "svelte/transition";
</script>

<div class="container text-left mt-5" in:fly={{ x: 200, delay:1000, duration: 4000 }}>
  <div class="lesson-option">
    <div>
      <a href="mailto:kipriecken@gmail.com" class="btn btn-lg my-5 align-self-center">Contact Kip</a>
      <p>
        In over twenty years of orchestral playing, and almost 30 years of
        playing music, I have often noticed musicians not playing to their
        potential and not enjoying what they do. I want to help change that. Working with me, we will:
      </p>
      <ul>
        <li>Deepen your connection with the music</li>
        <li>Find a more sustainable way of playing</li>
        <li>Create a more balanced approach to practicing and performing</li>
        <li>Learn to prevent injuries and feel better</li>
      </ul>
    </div>
    <div class="container text-left pt-4">
      <div class="lesson-type">
        <h3>Viola lesson</h3>
        <h5>30 or 60 minutes</h5>
        <p />
      </div>
      <div class="lesson-type">
        <h3>Violin lesson</h3>
        <h5>30 or 60 minutes</h5>
        <p />
      </div>
      <div class="lesson-type">
        <h3>Movement coaching (all instruments)</h3>
        <h5>30 or 60 minutes</h5>
        <p />
      </div>
    </div>
  </div>
</div>
