<script>
    import {fade} from 'svelte/transition';
    import {quintIn} from 'svelte/easing';
</script>

<div class="hero" in:fade="{{delay: 300, duration: 2500, quintIn: 1000}}"/>

<style>
  .hero {
    background-image: url("/images/KR28-min.jpg");
    background-size: cover;
    background-position: 48% center;
    height: 800px;
  }
</style>
