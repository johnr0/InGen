import { thomsonCrossSectionDependencies } from 'mathjs';
import React from 'react'
import io from 'socket.io-client';

class AIDrawCanvas extends React.Component{

    componentWillUnmount() {
        this.socket.close()
        console.log("component unmounted")
    }

    componentDidMount(){
        for(var i in this.props.mother_state.layers){
            var layer = this.props.mother_state.layers[i]
            this.props.mother_state.ratioData[layer.layer_id] = new Array(this.props.mother_state.pixelwidth*this.props.mother_state.pixelheight).fill(0);
        }
        this.props.mother_this.setState({})

        // var sensorEndpoint = "http://localhost:5001"
        this.socket = io('http://localhost:5001/', {
            reconnection: true,
            transports: ['websocket'],
        })

        console.log(this.socket)
        console.log("component mounted")
        var _this = this
        this.socket.on("gen_done", message => {
            if(_this.props.mother_state.stroke_id!=message['stroke_id']){
                return 
            }
            // console.log("gen done", message)
            if(this.props.mother_state.control_state == 'AI' && (this.props.mother_state.single_stroke_ratio>0 || (this.props.mother_state.single_stroke_ratio==0 && this.props.mother_state.action=='AI_brush'))){
                if(_this.props.mother_state.single_stroke_ratio>0 && _this.props.mother_state.gen_tick<parseInt(_this.props.mother_state.gen_steps*_this.props.mother_state.single_stroke_ratio/100)){
                    // var canvas = document.getElementById('AI_intermediate_canvas')
                    this.undo_store()
                    var canvas = document.getElementById('sketchpad_canvas_'+_this.props.mother_state.layers[_this.props.mother_state.current_layer].layer_id)
                    var ctx = canvas.getContext('2d')
                    
    
                    var img = new Image;
                    img.onload = function(){
                        ctx.drawImage(img, _this.props.mother_state.cutxmin, _this.props.mother_state.cutymin)
                        _this.ratioUpdate(_this.processGen.bind(_this))
                        var layers = _this.props.mother_state.layers
                        layers[_this.props.mother_state.current_layer].image = canvas.toDataURL()
                        _this.props.mother_this.setState({})
                        
                    }
                    img.src = message.data
                    
                    
                }else if(_this.props.mother_state.single_stroke_ratio==0 && _this.props.mother_state.action=='AI_brush'){
                    // var canvas = document.getElementById('AI_intermediate_canvas')
                    this.undo_store()
                    var canvas = document.getElementById('sketchpad_canvas_'+_this.props.mother_state.layers[_this.props.mother_state.current_layer].layer_id)
                    
                    var ctx = canvas.getContext('2d')
    
                    var img = new Image;
                    img.onload = function(){
                        // console.log(img.src)
                        ctx.drawImage(img, _this.props.mother_state.cutxmin, _this.props.mother_state.cutymin)
                        _this.ratioUpdate(_this.process_AIbrush_manual.bind(_this))
                        var layers = _this.props.mother_state.layers
                        layers[_this.props.mother_state.current_layer].image = canvas.toDataURL()
                        _this.props.mother_this.setState({})
                    }
                    img.src = message.data
                    
                    
                }else{
                    _this.endGen()
                }
            }
            
        })
        this.socket.on("connect", message => {
            
            console.log("connect", message)
        })
        this.socket.on("disconnect", message => {
            
            console.log("disconnect", message)
        })
    }

    ratioUpdate(callback){


        if(this.props.mother_state.single_stroke_ratio>0){
            this.props.mother_this.setState({gen_tick: this.props.mother_state.gen_tick+1})
        }
        


        var el_area = document.getElementById('AI_area_canvas')
        var ctx_area = el_area.getContext('2d');

        var ratioData = this.props.mother_state.ratioData[this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id]//ctx_ratio.getImageData(0,0,el_ratio.width, el_ratio.height);
        var areaData = ctx_area.getImageData(0,0,el_area.width, el_area.height);
        var areaData = this.props.mother_state.areaData
        
        var printed = false
        for (var i = 0; i < areaData.length; i+= 4) {

            if(areaData[i+3]==255){
                ratioData[parseInt(i/4)] = ratioData[parseInt(i/4)] + 1/this.props.mother_state.gen_steps*100
                if(printed==false){
                    console.log(ratioData[parseInt(i/4)], this.props.mother_state.gen_steps)
                    printed=true
                }
                
                if(ratioData[parseInt(i/4)]>100){
                    ratioData[parseInt(i/4)] = 100
                }
            }
        }

        /////
        var el_tmp = document.createElement('canvas')
        el_tmp.width = this.props.mother_state.pixelwidth
        el_tmp.height = this.props.mother_state.pixelheight
        var ctx_tmp = el_tmp.getContext('2d');
        var tmpData = ctx_tmp.getImageData(0,0,el_tmp.width, el_tmp.height)
        for (var i = 0; i < areaData.length; i+= 4) {
            tmpData.data[i+3] = parseInt(ratioData[parseInt(i/4)]*255/100)
            tmpData.data[i+2] = 0
            tmpData.data[i+1] = 0
            tmpData.data[i] = 0
            
        }
        ctx_tmp.putImageData(tmpData, 0, 0)
        console.log(el_tmp.toDataURL())
        /////


        this.props.mother_this.setState({}, function(){
            callback()
        })
        
    }

    undo_store(){
        var cur_layer = JSON.parse(JSON.stringify(this.props.mother_state.layers[this.props.mother_state.current_layer]))
        var overcoat_img = undefined
        if(this.props.mother_state.gen_tick==0){
            overcoat_img = this.props.mother_state.overcoat_img
        }
        
        var text_prompts = []
        var text_prompt_weights = []
        for(var i in this.props.mother_state.selected_prompt.prompts){
            var prompt_idx = this.props.mother_state.selected_prompt.prompts[i]
            var prompt = this.props.mother_state.prompts[prompt_idx]
            if(prompt.istext){
                text_prompts.push(prompt.prompt)
                text_prompt_weights.push(this.props.mother_state.selected_prompt.weights[i])
            }
        }
        var el_area = document.getElementById('AI_area_canvas')


        var undo_obj = {
            type:'gen',

            // stroke_id: this.props.mother_state.stroke_id, 

            gen_tick: this.props.mother_state.gen_tick,

            current_layer: this.props.mother_state.current_layer,
            layer:cur_layer, 
            // area_img: el_area.toDataURL(), 
            ratioData: JSON.parse(JSON.stringify(this.props.mother_state.ratioData)),
            overcoat_img: overcoat_img,
            guidance_scale:   this.props.mother_state.guidance_scale, 
            overcoat_ratio:  this.props.mother_state.overcoat_ratio,
            AI_brush_size: this.props.mother_state.AI_brush_size,
            single_stroke_ratio: this.props.mother_state.single_stroke_ratio,
            gen_steps: this.props.mother_state.gen_steps,
            selected_prompt: JSON.parse(JSON.stringify(this.props.mother_state.selected_prompt)), 
            directional_prompts: JSON.parse(JSON.stringify(this.props.mother_state.directional_prompts)),
            prompts: JSON.parse(JSON.stringify(this.props.mother_state.prompts)), 
            prompt_groups: JSON.parse(JSON.stringify(this.props.mother_state.prompt_groups)),
        }
        this.props.mother_state.undo_states.push(undo_obj)
        if(this.props.mother_state.undo_states.length>2000){
            this.props.mother_state.undo_states.shift();
        }
        this.setState({redo_states: []})

    }

    AIbrushInit_auto(e){
        var brush_canvas = document.createElement('canvas')
        brush_canvas.width = this.props.mother_state.AI_brush_size
        brush_canvas.height = this.props.mother_state.AI_brush_size
        var brush_canvas_ctx = brush_canvas.getContext('2d')
        brush_canvas_ctx.fillStyle='black'
        brush_canvas_ctx.fillRect(0, 0, brush_canvas.width, brush_canvas.height)
        brush_canvas_ctx.globalCompositeOperation = "destination-in";
        brush_canvas_ctx.drawImage(this.props.mother_state.brush_img, 0, 0, this.props.mother_state.AI_brush_size, this.props.mother_state.AI_brush_size)
        console.log(brush_canvas_ctx)

        var cur_colored_brush_img = new Image();

        var brush_pre_canvas = document.createElement('canvas')
        brush_pre_canvas.width = this.props.mother_state.pixelwidth
        brush_pre_canvas.height = this.props.mother_state.pixelheight
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')
        brush_pre_canvas_ctx.lineJoin = brush_pre_canvas_ctx.lineCap = 'round'
        
        // console.log(brush_canvas.toDataURL())
        cur_colored_brush_img.src = brush_canvas.toDataURL();

        var el = document.getElementById('AI_area_canvas')
        var cur_image = el.toDataURL()
        var ctx = el.getContext('2d');
        ctx.lineJoin = ctx.lineCap = 'round'
        
        // console.log(this.state.brush_img)
        var brush_cur = this.props.mother_this.getCurrentMouseOnBoard(e)

        brush_pre_canvas_ctx.clearRect(0,0,this.props.mother_state.pixelwidth,this.props.mother_state.pixelheight);

        var x = brush_cur[0]-this.props.mother_state.AI_brush_size/2;
        var y = brush_cur[1]-this.props.mother_state.AI_brush_size/2;
        brush_pre_canvas_ctx.drawImage(cur_colored_brush_img, x, y);

        if(this.props.mother_state.lasso_img!=undefined){
            brush_pre_canvas_ctx.globalCompositeOperation = 'destination-in'
            brush_pre_canvas_ctx.drawImage(this.props.mother_state.lasso_img, 0, 0, this.props.mother_state.pixelwidth, this.props.mother_state.pixelheight)
            brush_pre_canvas_ctx.globalCompositeOperation = 'source-over'
        }
        // move lasso image to context
        ctx.drawImage(brush_pre_canvas, 0, 0)
        var stroke_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        this.props.mother_this.setState({action:'AI_brush', stroke_id: stroke_id, brush_cur:this.props.mother_this.getCurrentMouseOnBoard(e), AI_cur_colored_brush_img: cur_colored_brush_img, AI_brush_pre_canvas:brush_pre_canvas, AI_origin_image: cur_image})
    }

    AIbrushMove_auto(e){
        var el = document.getElementById('AI_area_canvas')
        var ctx = el.getContext('2d');
        var brush_pre_canvas = this.props.mother_state.AI_brush_pre_canvas
        var brush_pre_ctx = brush_pre_canvas.getContext('2d');
        brush_pre_ctx.clearRect(0,0,this.props.mother_state.pixelwidth,this.props.mother_state.pixelheight);

        var brush_cur = this.props.mother_this.getCurrentMouseOnBoard(e)

        // for (var i=0; i<dist; i++){
        var x = brush_cur[0]-this.props.mother_state.AI_brush_size/2;
        var y = brush_cur[1]-this.props.mother_state.AI_brush_size/2;
        brush_pre_ctx.drawImage(this.props.mother_state.AI_cur_colored_brush_img, x, y);
        // }
        
        // apply lasso
        if(this.props.mother_state.lasso_img!=undefined){
            brush_pre_ctx.globalCompositeOperation = 'destination-in'
            brush_pre_ctx.drawImage(this.props.mother_state.lasso_img, 0, 0, this.props.mother_state.pixelwidth, this.props.mother_state.pixelheight)
            brush_pre_ctx.globalCompositeOperation = 'source-over'
        }
        // move lasso image to context
        ctx.drawImage(brush_pre_canvas, 0, 0)

        this.setState({brush_cur:brush_cur})
    }

    process_AIbrush_manual(){
        // this.props.mother_this.setState({action:'idle'})
        // setting the overcoat
        var brush_canvas = document.createElement('canvas')
        brush_canvas.width = this.props.mother_state.AI_brush_size
        brush_canvas.height = this.props.mother_state.AI_brush_size
        var brush_canvas_ctx = brush_canvas.getContext('2d')
        brush_canvas_ctx.fillStyle='black'
        brush_canvas_ctx.fillRect(0, 0, brush_canvas.width, brush_canvas.height)
        brush_canvas_ctx.globalCompositeOperation = "destination-in";
        brush_canvas_ctx.drawImage(this.props.mother_state.brush_img, 0, 0, this.props.mother_state.AI_brush_size, this.props.mother_state.AI_brush_size)
        // console.log(brush_canvas_ctx)

        var cur_colored_brush_img = new Image();
        cur_colored_brush_img.src = brush_canvas.toDataURL();

        var _this = this

        cur_colored_brush_img.onload=function(){
            var brush_pre_canvas = document.createElement('canvas')
            brush_pre_canvas.width = _this.props.mother_state.pixelwidth
            brush_pre_canvas.height = _this.props.mother_state.pixelheight
            var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')
            brush_pre_canvas_ctx.lineJoin = brush_pre_canvas_ctx.lineCap = 'round'
            
            

            var brush_cur = _this.state.brush_cur

            brush_pre_canvas_ctx.clearRect(0,0,_this.props.mother_state.pixelwidth,_this.props.mother_state.pixelheight);

            var x = brush_cur[0]-_this.props.mother_state.AI_brush_size/2;
            var y = brush_cur[1]-_this.props.mother_state.AI_brush_size/2;
            brush_pre_canvas_ctx.drawImage(cur_colored_brush_img, x, y);

            if(_this.props.mother_state.lasso_img!=undefined){
                brush_pre_canvas_ctx.globalCompositeOperation = 'destination-in'
                brush_pre_canvas_ctx.drawImage(_this.props.mother_state.lasso_img, 0, 0, _this.props.mother_state.pixelwidth, _this.props.mother_state.pixelheight)
                brush_pre_canvas_ctx.globalCompositeOperation = 'source-over'
            }

            var el_area = document.getElementById('AI_area_canvas')
            var ctx_area = el_area.getContext('2d');

            ctx_area.lineJoin = ctx_area.lineCap = 'round'
            ctx_area.clearRect(_this.props.mother_state.cutxmin,_this.props.mother_state.cutymin,
                _this.props.mother_state.cutxmax+1-_this.props.mother_state.cutxmin, 
                _this.props.mother_state.cutymax+1-_this.props.mother_state.cutymin)
            ctx_area.drawImage(brush_pre_canvas, 0, 0)

            ////

            

            var el_layer = document.getElementById('sketchpad_canvas_'+_this.props.mother_state.layers[_this.props.mother_state.current_layer].layer_id)
            var ctx_layer = el_layer.getContext('2d');

            // var el_overcoat = document.createElement('canvas');
            // el_overcoat.width = _this.props.mother_state.pixelwidth
            // el_overcoat.height = _this.props.mother_state.pixelheight
            // var ctx_overcoat = el_overcoat.getContext('2d');

            // var ratioData = _this.props.mother_state.ratioData//ctx_ratio.getImageData(0,0,el_ratio.width, el_ratio.height);
            var areaData = ctx_area.getImageData(0,0,el_area.width, el_area.height);
            var layerData = ctx_layer.getImageData(0,0,el_layer.width, el_layer.height);
            // var overcoatData = ctx_overcoat.getImageData(0,0,el_overcoat.width, el_overcoat.height)

            var cutxmax=0
            var cutxmin=_this.props.mother_state.pixelwidth
            var cutymax=0
            var cutymin=_this.props.mother_state.pixelheight

            for (var i = 0; i < areaData.data.length; i+= 4) {

                if(areaData.data[i+3]!=0){
                    var h = parseInt(i/4/_this.props.mother_state.pixelwidth)
                    var w = parseInt(i/4)%_this.props.mother_state.pixelwidth
                    if(w>cutxmax){
                        cutxmax=w
                    }
                    if(w<cutxmin){
                        cutxmin = w
                    }
                    if(h>cutymax){
                        cutymax=h
                    }
                    if(h<cutymin){
                        cutymin = h
                    }

                }

                // if((ratioData[parseInt(i/4)]>=100 || layerData.data[i+3]==255)  && areaData.data[i+3]==255){
                //     ratioData[parseInt(i/4)] = 100 - _this.props.mother_state.overcoat_ratio
                //     // overcoatData.data[i+3]=255
                //     // overcoatData.data[i+2]=0
                //     // overcoatData.data[i+1]=0
                //     // overcoatData.data[i]=0
                // }
            }

            // console.log(cutxmax, cutxmin, cutymax, cutymin)

            var x_add = parseInt(Math.min((cutxmax-cutxmin)*0.1, 50))
            var y_add = parseInt(Math.min((cutymax-cutymin)*0.1, 50))
            cutxmax = Math.min(cutxmax+x_add, _this.props.mother_state.pixelwidth-1)
            cutxmin = Math.max(cutxmin-x_add, 0)
            cutymax = Math.min(cutymax+y_add, _this.props.mother_state.pixelheight-1)
            cutymin = Math.max(cutymin-y_add, 0)

            var new_cutxmax = cutxmin
            var new_cutxmin = cutxmax
            var new_cutymax = cutymin
            var new_cutymin = cutymax
            // console.log(cutxmax, cutxmin, cutymax, cutymin)

            for(var i=cutxmin; i<=cutxmax; i++){
                for(var j=cutymin; j<=cutymax; j++){
                    var idx = (j*_this.props.mother_state.pixelwidth+i)*4
                    if(areaData.data[idx+3]!=0 || _this.props.mother_state.ratioData[_this.props.mother_state.layers[_this.props.mother_state.current_layer].layer_id][idx/4]>=100){
                        if(new_cutxmax<i){
                            new_cutxmax=i
                        }
                        if(new_cutxmin>i){
                            new_cutxmin=i
                        }
                        if(new_cutymax<j){
                            new_cutymax=j
                        }
                        if(new_cutymin>j){
                            new_cutymin=j
                        }
                    }
                }
            }
            // console.log(new_cutxmin, new_cutxmax, new_cutymin, new_cutymax)
            if(new_cutxmin<0 || new_cutymin<0 || new_cutymax>_this.props.mother_state.pixelheight || new_cutxmax>_this.props.mother_state.pixelwidth){
                // this.process_AIbrush_manual()
                return
            }

            // console.log(new_cutxmax, new_cutxmin, new_cutymax, new_cutymin)

            // ctx_overcoat.putImageData(overcoatData, 0, 0)


            // cut image
            var el_cut_area = document.createElement('canvas')
            el_cut_area.width = new_cutxmax+1-new_cutxmin
            el_cut_area.height = new_cutymax+1-new_cutymin
            var ctx_cut_area = el_cut_area.getContext('2d')

            var el_cut_layer = document.createElement('canvas')
            el_cut_layer.width = new_cutxmax+1-new_cutxmin
            el_cut_layer.height = new_cutymax+1-new_cutymin
            var ctx_cut_layer = el_cut_layer.getContext('2d')

            // var el_cut_overcoat = document.createElement('canvas')
            // el_cut_overcoat.width = new_cutxmax+1-new_cutxmin
            // el_cut_overcoat.height = new_cutymax+1-new_cutymin
            // var ctx_cut_overcoat = el_cut_overcoat.getContext('2d')
            

            ctx_cut_area.drawImage(el_area, new_cutxmin, new_cutymin, new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1, 0,0,new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1)
            // ctx_cut_overcoat.drawImage(el_overcoat, new_cutxmin, new_cutymin, new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1, 0,0,new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1)
            ctx_cut_layer.drawImage(el_layer, new_cutxmin, new_cutymin, new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1, 0,0,new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1)

            var layer_img = el_cut_layer.toDataURL()
            // var overcoat_img = el_cut_overcoat.toDataURL()
            var area_img = el_cut_area.toDataURL()

            var text_prompts = []
            var text_prompt_weights = []
            for(var i in _this.props.mother_state.selected_prompt.prompts){
                var prompt_idx = _this.props.mother_state.selected_prompt.prompts[i]
                var prompt = _this.props.mother_state.prompts[prompt_idx]
                if(prompt.istext){
                    text_prompts.push(prompt.prompt)
                    text_prompt_weights.push(_this.props.mother_state.selected_prompt.weights[i])
                }
            }

            var directional_prompts=[]
            for(var i in _this.props.mother_state.directional_prompts){
                var prompt_set = _this.props.mother_state.directional_prompts[i]
                var nps = {
                    promptA: prompt_set.promptA,
                    promptB: prompt_set.promptB,
                    value: prompt_set.value
                }
                directional_prompts.push(nps)
            }
            var sent_data = {
                'stroke_id': _this.props.mother_state.stroke_id,
                'layer_img':layer_img, 
                'area_img': area_img, 
                'ratioData': _this.props.mother_state.ratioData[_this.props.mother_state.layers[_this.props.mother_state.current_layer].layer_id],
                // 'overcoat_img': overcoat_img,
                'guidance_scale':   _this.props.mother_state.guidance_scale, 
                'overcoat_ratio':  _this.props.mother_state.overcoat_ratio/100,
                'text_prompts': text_prompts,
                'text_prompt_weights': text_prompt_weights,
                'directional_propmts': directional_prompts
            }

            // var stroke_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
 
            _this.props.mother_this.setState({action:'AI_brush', areaData: areaData.data.slice(),  cutxmin:new_cutxmin, cutymin:new_cutymin, cutxmax:new_cutxmax, cutymax:new_cutymax}, function(){
                // console.log('gen?', _this.props.mother_state.stroke_id)
                _this.socket.emit("gen_step", sent_data)
            })

        }
        

        


        // _this.props.mother_this.setState({gen_tick: 0, overcoat_img: el_cut_overcoat.toDataURL(), area_img: el_cut_area.toDataURL(), cutxmin: new_cutxmin, cutymin: new_cutymin, cutxmax: new_cutxmax, cutymax: new_cutymax}, function(){
        //     _this.processGen()
        //     ctx_area.clearRect(0,0,_this.props.mother_state.pixelwidth, _this.props.mother_state.pixelheight)
        // })



        
    }

    AIbrushInit(e){
        if(this.props.mother_state.current_layer==-1 || this.props.mother_state.selected_prompt==undefined){
            return
        }

        if(this.props.mother_state.single_stroke_ratio>0){
            this.AIbrushInit_auto(e)
        }else if(this.props.mother_state.single_stroke_ratio==0){
            var _this = this
            var stroke_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            this.setState({brush_cur:this.props.mother_this.getCurrentMouseOnBoard(e),}, function(){
                _this.props.mother_this.setState({stroke_id}, function(){
                    _this.process_AIbrush_manual()
                })
                
            })
            
        }
        
        
    }

    AIbrushMove(e){
        if(this.props.mother_state.single_stroke_ratio>0){
            this.AIbrushMove_auto(e)
        }else if(this.props.mother_state.single_stroke_ratio==0){
            this.setState({brush_cur:this.props.mother_this.getCurrentMouseOnBoard(e)})
        }
        

    }

    AIbrushEnd(e){

        // send to the AI function
        if(this.props.mother_state.single_stroke_ratio>0){
            if(this.props.mother_state.multi_strokes==false){
                this.initGen()
            }
        }else if(this.props.mother_state.single_stroke_ratio==0){
            var el_area = document.getElementById('AI_area_canvas')
            var ctx_area = el_area.getContext('2d');
            ctx_area.clearRect(0,0,this.props.mother_state.pixelwidth, this.props.mother_state.pixelheight)
        }
        

        this.props.mother_this.setState({action:'idle'})
    }

    initGen(){
        console.log('generation begin!')
        this.props.mother_this.setState({action:'idle'})
        // setting the overcoat

        var el_area = document.getElementById('AI_area_canvas')
        var ctx_area = el_area.getContext('2d');

        var el_layer = document.getElementById('sketchpad_canvas_'+this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id)
        var ctx_layer = el_layer.getContext('2d');

        var el_overcoat = document.createElement('canvas');
        el_overcoat.width = this.props.mother_state.pixelwidth
        el_overcoat.height = this.props.mother_state.pixelheight
        var ctx_overcoat = el_overcoat.getContext('2d');

        var ratioData = this.props.mother_state.ratioData[this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id]
        var areaData = ctx_area.getImageData(0,0,el_area.width, el_area.height);
        var layerData = ctx_layer.getImageData(0,0,el_layer.width, el_layer.height);
        var overcoatData = ctx_overcoat.getImageData(0,0,el_overcoat.width, el_overcoat.height)

        var cutxmax=0
        var cutxmin=this.props.mother_state.pixelwidth
        var cutymax=0
        var cutymin=this.props.mother_state.pixelheight

        for (var i = 0; i < areaData.data.length; i+= 4) {

            if(areaData.data[i+3]!=0){
                var h = parseInt(i/4/this.props.mother_state.pixelwidth)
                var w = parseInt(i/4)%this.props.mother_state.pixelwidth
                if(w>cutxmax){
                    cutxmax=w
                }
                if(w<cutxmin){
                    cutxmin = w
                }
                if(h>cutymax){
                    cutymax=h
                }
                if(h<cutymin){
                    cutymin = h
                }

            }

            if(ratioData[parseInt(i/4)]>=100 && areaData.data[i+3]==255){
                ratioData[parseInt(i/4)] = 100 - this.props.mother_state.overcoat_ratio
                overcoatData.data[i+3]=255
                overcoatData.data[i+2]=0
                overcoatData.data[i+1]=0
                overcoatData.data[i]=0
            }
        }

        console.log(cutxmax, cutxmin, cutymax, cutymin)

        var x_add = parseInt(Math.min((cutxmax-cutxmin)*0.1, 50))
        var y_add = parseInt(Math.min((cutymax-cutymin)*0.1, 50))
        cutxmax = Math.min(cutxmax+x_add, this.props.mother_state.pixelwidth-1)
        cutxmin = Math.max(cutxmin-x_add, 0)
        cutymax = Math.min(cutymax+y_add, this.props.mother_state.pixelheight-1)
        cutymin = Math.max(cutymin-y_add, 0)

        var new_cutxmax = cutxmin
        var new_cutxmin = cutxmax
        var new_cutymax = cutymin
        var new_cutymin = cutymax
        console.log(cutxmax, cutxmin, cutymax, cutymin)

        for(var i=cutxmin; i<=cutxmax; i++){
            for(var j=cutymin; j<=cutymax; j++){
                var idx = (j*this.props.mother_state.pixelwidth+i)*4
                if(areaData.data[idx+3]!=0 || this.props.mother_state.ratioData[this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id][idx/4]>=100){
                    if(new_cutxmax<i){
                        new_cutxmax=i
                    }
                    if(new_cutxmin>i){
                        new_cutxmin=i
                    }
                    if(new_cutymax<j){
                        new_cutymax=j
                    }
                    if(new_cutymin>j){
                        new_cutymin=j
                    }
                }
            }
        }

        console.log(new_cutxmax, new_cutxmin, new_cutymax, new_cutymin)

        ctx_overcoat.putImageData(overcoatData, 0, 0)

        var _this = this

        // cut image
        var el_cut_area = document.createElement('canvas')
        el_cut_area.width = new_cutxmax+1-new_cutxmin
        el_cut_area.height = new_cutymax+1-new_cutymin
        var ctx_cut_area = el_cut_area.getContext('2d')

        var el_cut_overcoat = document.createElement('canvas')
        el_cut_overcoat.width = new_cutxmax+1-new_cutxmin
        el_cut_overcoat.height = new_cutymax+1-new_cutymin
        var ctx_cut_overcoat = el_cut_overcoat.getContext('2d')

        ctx_cut_area.drawImage(el_area, new_cutxmin, new_cutymin, new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1, 0,0,new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1)
        ctx_cut_overcoat.drawImage(el_overcoat, new_cutxmin, new_cutymin, new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1, 0,0,new_cutxmax-new_cutxmin+1, new_cutymax-new_cutymin+1)


        _this.props.mother_this.setState({gen_tick: 0, areaData: areaData.data.slice(), overcoat_img: el_cut_overcoat.toDataURL(), area_img: el_cut_area.toDataURL(), cutxmin: new_cutxmin, cutymin: new_cutymin, cutxmax: new_cutxmax, cutymax: new_cutymax}, function(){
            _this.processGen()
            ctx_area.clearRect(0,0,_this.props.mother_state.pixelwidth, _this.props.mother_state.pixelheight)
        })

        // // send blob
        // el_cut_area.toBlob((area_blob)=>{
        //     el_cut_overcoat.toBlob((overcoat_blob) => {
                
        //     })
        // })
        

        

    }

    handleEmit=()=>{
        if(this.state.socketStatus==="On"){
        this.socket.emit("message", {'data':'Stop Sending', 'status':'Off'})
        this.setState({'socketStatus':"Off"})
    }
    else{        
        this.socket.emit("message", {'data':'Start Sending', 'status':'On'})
        this.setState({'socketStatus':"On"})
        }
        console.log("Emit Clicked")
    }

    processGen(){
        // get the layer
        var el_layer = document.getElementById('sketchpad_canvas_'+this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id)
        var ctx_layer = el_layer.getContext('2d');

        var el_cut_layer = document.createElement('canvas')
        el_cut_layer.width = this.props.mother_state.cutxmax+1-this.props.mother_state.cutxmin
        el_cut_layer.height = this.props.mother_state.cutymax+1-this.props.mother_state.cutymin
        var ctx_cut_layer = el_cut_layer.getContext('2d')

        ctx_cut_layer.drawImage(el_layer, this.props.mother_state.cutxmin, this.props.mother_state.cutymin, 
            this.props.mother_state.cutxmax-this.props.mother_state.cutxmin+1, this.props.mother_state.cutymax-this.props.mother_state.cutymin+1, 
            0,0,this.props.mother_state.cutxmax-this.props.mother_state.cutxmin+1, this.props.mother_state.cutymax-this.props.mother_state.cutymin+1)
        // console.log(el_cut_layer.toDataURL())
        var layer_img = el_cut_layer.toDataURL()
        var overcoat_img = undefined
        if(this.props.mother_state.gen_tick==0){
            overcoat_img = this.props.mother_state.overcoat_img
        }
        
        var text_prompts = []
        var text_prompt_weights = []
        for(var i in this.props.mother_state.selected_prompt.prompts){
            var prompt_idx = this.props.mother_state.selected_prompt.prompts[i]
            var prompt = this.props.mother_state.prompts[prompt_idx]
            if(prompt.istext){
                text_prompts.push(prompt.prompt)
                text_prompt_weights.push(this.props.mother_state.selected_prompt.weights[i])
            }
        }

        var directional_prompts=[]
        for(var i in this.props.mother_state.directional_prompts){
            var prompt_set = this.props.mother_state.directional_prompts[i]
            var nps = {
                promptA: prompt_set.promptA,
                promptB: prompt_set.promptB,
                value: prompt_set.value
            }
            directional_prompts.push(nps)
        }
        var sent_data = {
            'stroke_id': this.props.mother_state.stroke_id,
            'layer_img':layer_img, 
            'area_img':this.props.mother_state.area_img, 
            'ratioData': this.props.mother_state.ratioData[this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id],
            'overcoat_img': this.props.mother_state.overcoat_img,
            'guidance_scale':   this.props.mother_state.guidance_scale, 
            'overcoat_ratio':  this.props.mother_state.overcoat_ratio/100,
            'text_prompts': text_prompts,
            'text_prompt_weights': text_prompt_weights,
            'directional_propmts': directional_prompts
        }
        this.socket.emit("gen_step", sent_data)
            
        


    }

    endGen(){
        // var el_intermediate = document.getElementById('AI_intermediate_canvas')
        // var ctx_intermediate = el_intermediate.getContext('2d');
        // var el_layer = document.getElementById('sketchpad_canvas_'+this.props.mother_state.layers[this.props.mother_state.current_layer].layer_id)
        // var ctx_layer = el_layer.getContext('2d');


        // ctx_layer.drawImage(el_intermediate,0, 0)

        // var layers = this.props.mother_state.layers
        // layers[this.props.mother_state.current_layer].image = el_layer.toDataURL()

        // ctx_intermediate.clearRect(0,0, this.props.mother_state.pixelwidth, this.props.mother_state.pixelheight)

        this.props.mother_this.setState({stroke_id: undefined, gen_tick: -1, overcoat_blob: undefined, area_blob: undefined, cutxmin: undefined, cutymin: undefined, cutxmax: undefined, cutymax: undefined})
    }

    render(){
        return (<div style={{width: '100%', height: '100%', position:'absolute', top:'0', left: '0'}}>
            <canvas id='AI_intermediate_canvas' width={this.props.mother_state.pixelwidth} height={this.props.mother_state.pixelheight} style={{width: '100%', position:'absolute', top:'0', left: '0'}}></canvas>
            <canvas id='AI_area_canvas' width={this.props.mother_state.pixelwidth} height={this.props.mother_state.pixelheight} style={{opacity: 0.5, width: '100%', position:'absolute', top:'0', left: '0'}}></canvas>
            
        </div>)
    }
}
export default AIDrawCanvas;