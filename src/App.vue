<script setup>


import { ref } from 'vue'

const events = ref([
  {
    id: 1,
    title: 'Community Clean-Up Day',
    date: '15 September 2026',
    location: 'Clayton'
  },
  {
    id: 2,
    title: 'E-Waste Collection Drive',
    date: '20 September 2026',
    location: 'Melbourne CBD'
  },
  {
    id: 3,
    title: 'Plastic Free Workshop',
    date: '25 September 2026',
    location: 'Glen Waverley'
  }
])

const resources = ref([
  {
    id: 1,
    title: 'How to Recycle Plastic',
    type: 'Guide'
  },
  {
    id: 2,
    title: 'Understanding Circular Economy',
    type: 'Article'
  },
  {
    id: 3,
    title: 'Composting Basics',
    type: 'Video'
  }
])


</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
    <TheWelcome />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
