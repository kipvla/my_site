<script>
  import { link } from "svelte-routing";
  import { onMount } from "svelte";
  // onMount(() => {
    function classToggle() {
      const navs = document.querySelectorAll(".navbar-items");
      navs.forEach((nav) => nav.classList.toggle("navbar-toggle-show"));
    }
  //   document
  //     .querySelector(".navbar-toggler")
  //     .addEventListener("click", classToggle);
  //   document
  //     .querySelector(".navbar-items")
  //     .addEventListener("click", classToggle);
  // });
</script>

<div id="mainNavbar" class="navbar fixed-top">
  <div class="d-flex justify-content-between">
    <a href="/" class="navbar-link-brand font-weight-light"
      >&#119073 <span>
        kip <span class="name"> riecken, viola</span>
      </span>
    </a>
    <button
      class="navbar-toggler navbar-toggler-right"
      type="button"
      on:click={classToggle}>
      <span class="icon-bar top-bar" />
      <span class="icon-bar middle-bar" />
      <span class="icon-bar bottom-bar" />
      <span class="sr-only">Toggle navigation</span>
    </button>
  </div>

  <!-- <div class="nav-link nav-link-toggle"><i class="fas fa-bars" /></div> -->
  <nav class="navbar-items" id="navbarResponsive">
    <a href="/about" use:link class="nav-link font-weight-light" on:click={classToggle}>About</a>
    <a href="/lessons" use:link class="nav-link" on:click={classToggle}>Lessons</a>
    <a href="/blog" use:link class="nav-link" on:click={classToggle}>Blog</a>
    <a href="/contact" use:link class="nav-link" on:click={classToggle}>Contact</a>
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
  /* .nav-link-toggle {
    border: none;
  } */
  .navbar-toggler:focus {
    outline: none;
    background: transparent !important;
  }
  @media only screen and (max-width: 820px) {
    .navbar {
      align-items: stretch;
    }
  }
  @media only screen and (min-width: 821px) {
    .navbar-items {
      visibility: visible!important;
    }
    .navbar-toggler {
      display: none;
        }
  }

  .navbar-toggler .icon-bar {
    background-color: var(--text);
    transform: rotate(0deg) translate(0px, 0px);
    transition: ease all 0.2s;
  }

  .navbar-toggler .icon-bar {
    display: block;
    width: 22px;
    height: 2px;
    border-radius: 1px;
  }

  .navbar-toggler .icon-bar + .icon-bar {
    margin-top: 4px;
  }

  .icon-bar:nth-child(2) {
    width: 16px;
    transition: ease all 0.2s;
  }

  .navbar-toggler:hover > .icon-bar:nth-child(2) {
    width: 22px;
    transition: ease all 0.2s;
  }

  .navbar-toggler:active > .icon-bar:nth-child(2) {
    width: 22px;
    transition: ease all 0.2s;
  }

  .navbar-toggler:not(.collapsed) .icon-bar:nth-child(1) {
    transform: rotate(45deg) translate(5px, 4px);
    transition: ease all 0.2s;
  }

  .navbar-toggler:not(.collapsed) .icon-bar:nth-child(2) {
    opacity: 0;
    transition: ease all 0.2s;
  }

  .navbar-toggler:not(.collapsed) .icon-bar:nth-child(3) {
    transform: rotate(-45deg) translate(4px, -4px);
    transition: ease all 0.2s;
  }
</style>
