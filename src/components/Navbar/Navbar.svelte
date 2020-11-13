<script>
  import { link } from "svelte-routing";
  import { onMount } from "svelte";
  onMount(() => {
    function classToggle() {
      const navs = document.querySelectorAll(".navbar-items");
      navs.forEach((nav) => nav.classList.toggle("navbar-toggle-show"));
    }
    document
      .querySelector(".nav-link-toggle")
      .addEventListener("click", classToggle);
  });
</script>

<div id="mainNavbar" class="navbar fixed-top">
  <a href="/" class="nav-link navbar-link-brand">kip riecken</a>
  <div class="nav-link nav-link-toggle"><i class="fas fa-bars" /></div>
  <nav class="navbar-items" />
  <nav class="navbar-items navbar-items-right">
    <a href="/about" use:link class="nav-link">About</a>
    <a href="/lessons" use:link class="nav-link">Lessons</a>
    <a href="/blog" use:link class="nav-link">Blog</a>
    <a href="/contact" use:link class="nav-link">Contact</a>
  </nav>
</div>
