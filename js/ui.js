nbge_ui = new (function(){
    var self = this;
    var docs = {};
    var activeDoc = '';
    diagram_manager = null;

    var storeDiagram = function(diagram){
        localStorageManager.put_prefixed('save', activeDoc, diagram);
    }

    var loadDiagram = function(){
        return localStorageManager.get_prefixed('save', activeDoc);
    }

    var setActiveDoc = function(key){
        activeDoc = key;
        $('#document_name').html(key);
    }

    self.updateDocs = function(){
        // local storage
        docs = localStorageManager.get_all_prefixed('save');
    }

    //Render the 'menu' area
    var renderDocs = function(){
        docs = localStorageManager.get_all_prefixed('save');
        $('#saves').empty();
        for(var i in docs){
            (function(name){
                var item = $("<li>"+name+"</li>");
                if(name == activeDoc){ 
                    item.addClass('selected');
                }

                item.click(function(){
                    $('#saves li.selected').removeClass('selected');
                    setActiveDoc(name);
                    item.addClass('selected');
                    diagram_manager.diagram(localStorageManager.get_prefixed('save',name));
                });
                $('#saves').append(item);
            })(i);
        }

        $('#Delete').click(function(){
            localStorageManager.remove_prefixed('save', activeDoc);
            $('#saves li.selected').remove();
        });
        
        $('#input').change(function(){
            var files = $(this)[0].files;
            // Do nothing if there are no files.
            if(files.length < 1 ) return;
            
            // Otherwise try to parse.
            var fname = $(this)[0].files[0].name;
            var reader = new FileReader();
            reader.onload = function(r){
                try{
                    diagramState = JSON.parse(r.target.result);
                    diagram_manager.diagram(diagramState);
                    //$('#document_name').html('')
                    renderDocs();
                }catch(e){
                    console.log('Error loading file');
                }
            }
            reader.readAsText($(this)[0].files[0]);
        });
        
        $('#Export a').click(function(){
            $(this).attr('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(localStorage[activeDoc]));
        });
        
        $('#documents .addlevel').click(function(){
            diagramState = bg_diagram();
            activeDoc = prompt('New diagram name?');
            if(activeDoc == null) return;
            localStorageManager.put_prefixed('save',activeDoc, diagramState);
            renderDocs();
        });
    }

    $(window).resize(function(){
        diagram_manager.render();
    });

    // This function kicks everything off!
    $(document).ready(function () {

        diagram_manager = nbge();
        
        diagram_manager.diagram_changed(function(){
            storeDiagram(diagram_manager.diagram())
        });

        diagram_manager.parent($('#diagram-container'));

        // Global diagram state
        if(activeDoc == ''){
            diagram_manager.diagram(bg_diagram()).render();
            setActiveDoc('Untitled');
            storeDiagram(diagram_manager.diagram());
            renderDocs();
        }

        $('#document_name').click(function(e){
            e.stopPropagation();
            $(this).attr('contentEditable', 'true');
        }).focusout(function(e){
            e.stopPropagation();
            $(this).attr('contentEditable', 'false');
            var title = $(this)[0].innerText;
            if(localStorageManager.has_key_prefixed('save', activeDoc)){
                var r = localStorageManager.remove_prefixed('save',activeDoc);
                localStorageManager.put_prefixed('save', title, r);
            }else{
                setActiveDoc(title);
                storeDiagram(diagram_manager.diagram());
            }
            renderDocs();
        });
        
    });
})();