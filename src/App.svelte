<script>
  // pages
  import Home from "./pages/Home.svelte";
  import Blog from "./pages/Blog.svelte";
  import Contact from "./pages/Contact.svelte";
  import Lessons from "./pages/Lessons.svelte";
  import About from "./pages/About.svelte";
  import SinglePost from "./components/Blog/SinglePost.svelte";
  // router
  import { Router, Route, Link } from "svelte-routing";
  // components
  import Navbar from "./components/Navbar/Navbar.svelte";
  import Footer from "./components/Footer.svelte";
</script>

<Router>
  <Navbar />
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="/lessons" component={Lessons} />
  <Route path="/blog" component={Blog} />
  <Route path="/blog/:id" component={SinglePost}/>
  <Route path="/contact" component={Contact} />
  <Footer />
</Router>
