<script>

    const parseDate = date => {
        console.log(date);
        date.Date.toString().split(/-|T|:/)
    };
    // const arr = parseDate(place);
    const formatDate = arr => `${arr[3]}:${arr[4]}, ${arr[1]}/${arr[2]}/${arr[0]}`;

    const server = `http://${window.location.hostname}:8080`;

    const fetchBlogs = fetch(`${server}/blogposts`)
        .then((data) => {
            console.log('succ', data);
            return data.json();
        })
        .catch((data) => {
            console.log('error', data);
            return data;
        });
</script>

{#await fetchBlogs}
    <div class="container d-flex justify-content-center mt-5">
        <p>...waiting</p>
    </div>
{:then data}
    {#each data.places as place}
        <div class="container">
            <div class="col col-lg-2" />
            <div class="col col-lg-8 blog-post">
                <!-- svelte-ignore a11y-img-redundant-alt -->
                <h2 class="text-capitalize mb-3">{place.Title}</h2>
                <img class="blog-image img-thumbnail" src={place.Image} alt="" />
                <h5 class="mt-4">
                    {formatDate(parseDate(place))}
                </h5>
                <!-- <h5>{data.time}</h5> -->
                <p class="justify-content-center my-4 text-dark">{place.Body}</p>
            </div>
            <div class="col col-lg-2" />
            <hr />
        </div>
    {/each}
{:catch error}
    <p>An error occurred! {`${error}`}</p>
{/await}
