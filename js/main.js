

// 行转换器
var rowConverter = function(d) {
  // console.log(d);
	return {
		source: d.source,
		target: d.target,
		num: d.number
	}
}


// 这个函数生成节点数据，nodes是一个列表，里面全是对象{id:""}
function nodesGenerater(links){

  nodes = [];

  // 先形成简单的数据，元素就是字符串, 已去重复
  for(let i = 0; i <links.length; i++){
    if(nodes.indexOf(links[i].source) == -1 ){
      nodes.push(links[i].source);
    }
    if(nodes.indexOf(links[i].target) == -1){
      nodes.push(links[i].target);
    }
  }

  nodes.sort();

  // 再将字符串转变为对象
  for(let i=0; i <nodes.length; i++){
    nodes[i]={id:nodes[i]};
  }

  return nodes;
}




// 下面d3的csv数据接口，links为一个list，里面包含很多{source：，target：，number：}
d3.csv("./author_rel_cleaned0.csv", rowConverter).then(function(links) {

  let nodes;
  let w = 1500,
      h = 1400,
      r = 9;
  let colors = ["rgb(204,54,98)","rgb(247,215,131)","rgb(70,129,206)","rgb(100,0,0)","rgb(53,169,147)","rgb(224,118,90)","rgb(0,91,157)","rgb(109,219,196)","rgb(204,119,170)","rgb(149,65,200)"];

  //获取input标签的值，通过触发按钮
  button = document.getElementById("search")
  button.onclick = findNodes

  button = document.getElementById("reset")
  button.onclick = resetFunc

  // 通过nodeGenerater提取links里面的节点，节点升序并已去重
  nodes = nodesGenerater(links);

  console.log(nodes);
  console.log(links);

  // 生成SVG对象
  let svg = d3.select(".mainbody")
          .append("svg")
          .attr("class", "palette")
          .attr("width", w)
          .attr("height", h);
  
  // 生成力向图的模拟器，这个函数主要用于计算节点，边的位置，动画
  let forceSim = d3.forceSimulation(nodes).alpha(1.5);
  
  // 创建四个主要的力，其中link定义边之间的指向关系
  let forceLink = d3.forceLink(links); 
  let forceManyBody = d3.forceManyBody();
  let forceCenter = d3.forceCenter(10)
                      .x(w / 2)
                      .y(h / 2);
  let forceCollide = d3.forceCollide();
                
  // 设置这些力的具体参数
  forceLink.id( d => d.id )
          //  .strength(0.1)
           .distance(60)
          //  .iterations(d => d.num);
  forceManyBody.strength(-60)
               .distanceMax(250)
               .distanceMin(80);
  forceCollide.radius(r*1.3)
              .strength(0.1)
              .iterations(1);

  // 将这些力加入模拟系统
  forceSim.force("link", forceLink)
       .force("charge", forceManyBody)
       .force("center", forceCenter)
       .force("colide", forceCollide)
       .on("tick", ticked);

  // linkset是html图形元素的集合，links是数据
  let linkSet = svg.append("g")
                  .attr("class","links")
                  .selectAll("line")
                  .data(links)
                  .enter()
                  .append("line")
                  .attr("stroke-opacity", d => d.num*0.1>1 ? 1 : d.num*0.1)
                  .attr("stroke-width", d => d.num*1.2>5 ? 5 : d.num*1.2)
                  .attr("stroke", "rgb(33,39,51)");

  // nodeSet是html图形元素的集合，nodes是数据.
  let nodeSet = svg.append("g")
                  .attr("class","nodes")
                  .selectAll("g")
                  .data(nodes)
                  .enter()
                  .append("g")
                  .call(d3.drag()
                          .on("start", dragstarted)
                          .on("drag", dragged)
                          .on("end", dragended))
                  .on("click",d => fadeStyle(d.id.toLowerCase()));

  // 三个drag函数在最下面
  let circleSet = nodeSet.append("circle")
                        .attr("r",r)
                        .attr("fill", (d,i) => colors[i%10])
                        .attr("fill-opacity",0.9);
                        
  let lables = nodeSet.append("text")
                    .text(d => d.id)
                    .attr('x', 6)
                    .attr('y', 3)
                    .attr("font-size", r*1);

  nodeSet.append("title")
         .text(d => d.id);

  
  //生成文本框的下拉提示框
  let nameList = d3.select("#nameList")
                    .selectAll("option")
                    .data(nodes)
                    .enter()
                    .append("option")
                    .attr("value",d=>d.id);
  // var r = 10; //r本意是所有节点的半径，用来作为边界
  function ticked() {
    let r=50;

    nodeSet
      .attr("transform", function(d) {
        // console.log("node1 "+d.x)
        d.x = Math.max(r, Math.min(w - r, d.x));
        d.y = Math.max(r, Math.min(h - r, d.y));
        // console.log("node2 "+d.x)
        return "translate(" + d.x + "," + d.y + ")";
      });

    linkSet
      .attr("x1", function(d) {
        // console.log("link"+d.source.x);
        return d.source.x = Math.max(r, Math.min(w - r, d.source.x))
      })
      .attr("y1", function(d) {
        return d.source.y = Math.max(r, Math.min(h - r, d.source.y))
      })
      .attr("x2", function(d) {
        return d.target.x = Math.max(r, Math.min(w - r, d.target.x))
      })
      .attr("y2", function(d) {
        return d.target.y = Math.max(r, Math.min(h - r, d.target.y))
      });
  };


  function dragstarted(d) {
    if (!d3.event.active) forceSim.alphaTarget(0.2).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  
  function dragended(d) {
    if (!d3.event.active) forceSim.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  

  function getText(){
    input = document.getElementById("nameValue");
    text = input.value;
    if(text != null && text != undefined && text != ''){
      text = text.toLowerCase();
      let ifError = true;
      for(i=0;i<nodes.length;i++){
        if(text === nodes[i].id.toLowerCase()){
          ifError = false;
        }
      }
      if(ifError){
        alert("doesn't contain this reseacher!");
        return false
      }else{
        return text;
      }
    }else{
      alert("empty inputs !");
      return false;
    }
  }


  function fadeStyle(text){
    if(text){
      let checkList = [];

      for(i=0; i<links.length;i++){
        if (links[i].target.id.toLowerCase() == text && checkList.indexOf(links[i].target.id.toLowerCase()) == -1 ){
          checkList.push(links[i].source.id.toLowerCase());
        }
        if (links[i].source.id.toLowerCase() == text && checkList.indexOf(links[i].source.id.toLowerCase()) == -1 ){
          checkList.push(links[i].target.id.toLowerCase());
        }
      }

      checkList.push(text);

      nodeSet.select("circle")
                .transition("nodechange")
                .duration(300)
                .attr("fill", (node,i)=>{
                  if(checkList.indexOf(node.id.toLowerCase()) > -1) {
                    return "purple";
                  } else {
                    return colors[i%10];
                  }
                })
                .attr("fill-opacity", (node,i)=>{
                  if(checkList.indexOf(node.id.toLowerCase()) > -1) {
                    return 0.9;
                  } else {
                    return 0.1;
                  }
                })
                .attr("r", node=>{
                  if(checkList.indexOf(node.id.toLowerCase()) > -1) {
                    return r*2;
                  }else {
                    return r;
                  }
                })
                .on("end", function(node,index) {
                  d3.select(this)
                    .transition("nodechange1")
                    .duration(1000)
                    .attr("fill", function(d,i) {
                      return colors[index%10];
                    })
                    // .attr("r", r)
                });

      lables.transition("textchange")
              .duration(200)
              .attr("font-size", function(node) {
                if(checkList.indexOf(node.id.toLowerCase()) > -1) {
                  return r*2;
                } else {
                  return r*1;
                }
              })
              .attr("opacity", (node,i)=>{
                if(checkList.indexOf(node.id.toLowerCase()) > -1) {
                  return 1;
                } else {
                  return 0.6;
                }
              });

      linkSet.style("stroke-opacity", function(line) {
        if(line.target.id.toLowerCase() == text || line.source.id.toLowerCase() == text) {
          return 0.9;
        } else {
          return 0.1;
        }
      });

    }
  }


  function findNodes(){
    text = getText();
    fadeStyle(text);
  }
  
  function exitFunc(){

  }
  function resetFunc(){

    nodeSet.select("circle")
                .transition("nodechange")
                .duration(300)
                .attr("fill", (node,i)=>colors[i%10])
                .attr("fill-opacity", 0.9)
                .attr("r", r);

      lables.transition("textchange")
              .duration(200)
              .attr("font-size", r*1)
              .attr("opacity", 1);

      linkSet.style("stroke-opacity", d => d.num*0.1>1 ? 1 : d.num*0.1);
  }


})

