<script setup lang="ts">
console.log("favorites.vue");
const favorites = [
  "book1",
  "book2",
  "book3",
  "book4",
  "book5"
]
const description = [
  `book1 description
book1 description
book1 description`,

  `book2 description
book2 description
book2 description`,

  `book3 description
book3 description
book3 description`,

  `book4 description
book4 description
book4 description`,

  `book5 description
book5 description
book5 description`
]
</script>
<template>
  <div>
    <div v-for="(book, index) in favorites">
      <h3 class="text-lg font-semibold my-2">{{index+1}}. {{book}}</h3>
      <p class="whitespace-pre-wrap break-words">{{description[index]}}</p>
    </div>
  </div>
</template>