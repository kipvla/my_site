<!-- <script>
    import Bob from './Bob.svelte';
    const fetchBlogs = fetch(`/api/blogposts`)
        .then((data) => {
            console.log("succ", data);
            return data.json();
        })
        .catch((data) => {
            console.log("error", data);
            return data;
        });
</script>

{#await fetchBlogs}
    <div class="container d-flex justify-content-center mt-5">
        <p>...waiting</p>
    </div>
{:then data}
    {#each data.places as place}
        <Bob title={place.Title} body={place.Body} image={place.Image} />
    {/each}
{/await} -->
