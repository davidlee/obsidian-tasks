<!-- placeholder to force blank line before included text -->

- ```group by function task.tags.map( (tag) => tag.split('/')[0].replace('#', '') )```
    - `#tag/subtag/sub-sub-tag` gives **`tag`**.
- ```group by function task.tags.map( (tag) => tag.split('/')[1] ? tag.split('/').slice(1, 2) : '')```
    - `#tag/subtag/sub-sub-tag` gives **`subtag`**.
- ```group by function task.tags.map( (tag) => tag.split('/')[2] ? tag.split('/').slice(2, 3) : '')```
    - `#tag/subtag/sub-sub-tag` gives **`sub-sub-tag`**.
- ```group by function task.tags.map( (tag) => tag.split('/')[3] ? tag.split('/').slice(3, 4) : '')```
    - `#tag/subtag/sub-sub-tag` gives no heading, as there is no value at the 4th level.
- ```group by function task.tags.map( (tag) => tag.split('/')[0] )```
    - `#tag/subtag/sub-sub-tag` gives **`#tag`**.
- ```group by function task.tags.map( (tag) => tag.split('/')[1] ? tag.split('/').slice(0, 2).join('/') : '')```
    - `#tag/subtag/sub-sub-tag` gives **`#tag/subtag`**.
- ```group by function task.tags.map( (tag) => tag.split('/')[2] ? tag.split('/').slice(0, 3).join('/') : '')```
    - `#tag/subtag/sub-sub-tag` gives **`#tag/subtag/sub-sub-tag`**.
- ```group by function task.tags.map( (tag) => tag.split('/')[3] ? tag.split('/').slice(0, 4).join('/') : '')```
    - `#tag/subtag/sub-sub-tag` gives no heading, as there is no value at the 4th level.


<!-- placeholder to force blank line after included text -->
