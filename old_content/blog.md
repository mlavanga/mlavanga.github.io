---
layout: post_list
title: Computational Neuroscientist, Data Scientist, Postdoctoral researcher at the theoretical neuroscience group - INS in Aix-Marseille University
version: 2

footer_show_references: false
---

<main class="page-content" aria-label="Content">
  <div class="wrapper">
    <div class="container ">        
        {% assign posts = site.posts%}
        {% for post in posts %}
            <h3>{{post.title}}</h3>
            <h4>{{ post.date| date: "%Y-%m-%d"}}</h4>
            <p>{{ post.content}}</p>
        {% endfor %}
      </div>

  </div>
</main>