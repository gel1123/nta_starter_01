<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/solid'
console.log("index.vue");
</script>
<template>
  <div>
    <h2 class="text-xl font-bold my-2">Nuxt3 Application + Tailwind CSS + AWS S3</h2>
    <div>Welcome to my portfolio!</div>
    <h2 class="text-xl font-bold my-2">MENU</h2>
    <p class="inline-flex items-center">
      <ChevronRightIcon class="mr-2 h-4"/>
      <NuxtLink to="/favorites" class="text-blue-500 hover:text-blue-700"> Favorites</NuxtLink>
    </p>
  </div>
</template>