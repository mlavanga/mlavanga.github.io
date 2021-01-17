---
layout: pub_layout
title: Computational Neuroscientist, Data Scientist, Postdoctoral researcher at the theoretical neuroscience group - INS in Aix-Marseille University
version: 2

footer_show_references: false
---

<main class="page-content" aria-label="Content">
  <div class="wrapper">
    <div class="container ">        
      <h3>Publications</h3>
      
      <ul>
        {% assign articles = site.articles | sort: 'date' | reverse %}
        {% for article in articles %}
          <li>
            <p>{{ article.content}}</p>
          </li>
        {% endfor %}
      </ul>
      </div>

  </div>
</main>