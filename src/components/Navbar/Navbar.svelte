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
    document
      .querySelector(".navbar-items")
      .addEventListener("click", classToggle);
  });
</script>

<div id="mainNavbar" class="navbar fixed-top">
  <a href="/" class="navbar-link-brand font-weight-light"
    >&#119073 <span>
      kip <span class="name"> riecken, viola</span>
    </span>
  </a>
  <div class="nav-link nav-link-toggle"><i class="fas fa-bars" /></div>
  <nav class="navbar-items">
    <a href="/about" use:link class="nav-link font-weight-light">About</a>
    <a href="/lessons" use:link class="nav-link">Lessons</a>
    <a href="/blog" use:link class="nav-link">Blog</a>
    <a href="/contact" use:link class="nav-link">Contact</a>
  </nav>
</div>

<style>
  a > span {
    transition: color 1s ease-in-out;
  }
  a > span:hover {
    color: white;
    transition: color 1s ease-in-out;
    text-decoration: none;
  }
</style>
